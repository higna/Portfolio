"""
Cocoa Field Evaluation Pipeline (with Cashew support).
Downloads form data, aggregates, optionally generates charts, uploads.
Usage: python clean_cocoa_field_eval.py <api_key> <base_url> <form_id> <creds_path> <spreadsheet_config_path> <spreadsheet_key> [generate_charts]
"""

import sys, json, os, tempfile, logging, traceback, re, math
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.path import Path
import numpy as np
import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import gspread_dataframe as gd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("clean_cocoa_field_eval")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "..", "output", "cocoa_eval")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


# -----------------------------------------------------------
# GLOBAL STYLE
# -----------------------------------------------------------
plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "axes.edgecolor": "#D5D8DC",
        "axes.labelcolor": "#2C3E50",
        "text.color": "#2C3E50",
        "xtick.color": "#2C3E50",
        "ytick.color": "#2C3E50",
        "axes.titleweight": "bold",
    }
)
TITLE_COLOR = "#2C3E50"
SUBTITLE_COLOR = "#5D6D7E"

# -----------------------------------------------------------
# COLUMN DEFINITIONS (Cashew added alongside Plantain)
# -----------------------------------------------------------
COLS_TO_KEEP = [
    "heading/location",
    "heading/farmSize",
    "heading/block",
    "heading/blockSize",
    "heading/_gps_latitude",
    "heading/_gps_longitude",
    "totalFarmers",
    "totalCocoa",
    "totalCocoaMature",
    "totalCocoaImmature",
    "totalCocoaNewlyPlanted",
    "totalCocoaDead",
    "totalCocoaProductive",
    "totalCocoaUnproductive",
    "totaloilPalm",
    "totaloilPalmMature",
    "totaloilPalmImmature",
    "totaloilPalmNewlyPlanted",
    "totaloilPalmDead",
    "totaloilPalmProductive",
    "totaloilPalmUnproductive",
    "totalplantain",
    "totalplantainMature",
    "totalplantainImmature",
    "totalplantainNewlyPlanted",
    "totalplantainDead",
    "totalplantainProductive",
    "totalplantainUnproductive",
    "totalcashew",
    "totalcashewMature",
    "totalcashewImmature",
    "totalcashewNewlyPlanted",
    "totalcashewDead",
    "totalcashewProductive",
    "totalcashewUnproductive",
    "conclusion/enumeratorName",
]

RENAME_MAP = {
    "heading/location": "Location",
    "heading/farmSize": "Farm Size",
    "heading/block": "Block",
    "heading/blockSize": "Block Size",
    "heading/_gps_latitude": "GPS Latitude",
    "heading/_gps_longitude": "GPS Longitude",
    "totalFarmers": "Total Farmers",
    "totalCocoa": "Total Cocoa",
    "totalCocoaMature": "Total Cocoa Mature",
    "totalCocoaImmature": "Total Cocoa Immature",
    "totalCocoaNewlyPlanted": "Total Cocoa Newly Planted",
    "totalCocoaDead": "Total Cocoa Dead",
    "totalCocoaProductive": "Total Cocoa Productive",
    "totalCocoaUnproductive": "Total Cocoa Unproductive",
    "totaloilPalm": "Total Oil Palm",
    "totaloilPalmMature": "Total Oil Palm Mature",
    "totaloilPalmImmature": "Total Oil Palm Immature",
    "totaloilPalmNewlyPlanted": "Total Oil Palm Newly Planted",
    "totaloilPalmDead": "Total Oil Palm Dead",
    "totaloilPalmProductive": "Total Oil Palm Productive",
    "totaloilPalmUnproductive": "Total Oil Palm Unproductive",
    "totalplantain": "Total Plantain",
    "totalplantainMature": "Total Plantain Mature",
    "totalplantainImmature": "Total Plantain Immature",
    "totalplantainNewlyPlanted": "Total Plantain Newly Planted",
    "totalplantainDead": "Total Plantain Dead",
    "totalplantainProductive": "Total Plantain Productive",
    "totalplantainUnproductive": "Total Plantain Unproductive",
    "totalcashew": "Total Cashew",
    "totalcashewMature": "Total Cashew Mature",
    "totalcashewImmature": "Total Cashew Immature",
    "totalcashewNewlyPlanted": "Total Cashew Newly Planted",
    "totalcashewDead": "Total Cashew Dead",
    "totalcashewProductive": "Total Cashew Productive",
    "totalcashewUnproductive": "Total Cashew Unproductive",
    "conclusion/enumeratorName": "Enumerator Name",
}

# All numeric columns (including Cashew)
NUMERIC_COLS = [
    v
    for k, v in RENAME_MAP.items()
    if k
    not in [
        "heading/location",
        "heading/farmSize",
        "heading/block",
        "heading/blockSize",
        "heading/_gps_latitude",
        "heading/_gps_longitude",
        "conclusion/enumeratorName",
    ]
]
META_COLS = ["Farm Size", "Block Size", "GPS Latitude", "GPS Longitude"]
STATUSES = ["Productive", "Unproductive", "Immature", "Newly Planted", "Dead"]
STATUS_COLORS = ["#27AE60", "#E67E22", "#3498DB", "#F1C40F", "#E74C3C"]
CROP_COLORS = {
    "Cocoa": "#2E86C1",
    "Oil Palm": "#28B463",
    "Plantain": "#F39C12",
    "Cashew": "#8E44AD",
}


# -----------------------------------------------------------
# CLEANING HELPERS
# -----------------------------------------------------------
def clean_block(block_str):
    if pd.isna(block_str):
        return None
    match = re.search(r"\d+", str(block_str))
    return int(match.group()) if match else None


def clean_location(loc_str):
    if pd.isna(loc_str):
        return loc_str
    s = str(loc_str)
    s = re.sub(r"[-_/]", " ", s)
    s = re.sub(r"\bfarm\b", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+", " ", s).strip()
    return s.title()


def clean_enumerator(name):
    if pd.isna(name):
        return "Unknown"
    s = str(name).strip()
    return "Unknown" if s == "" else s.title()


# -----------------------------------------------------------
# RIBBON SANKEY (unchanged, works with any crop list)
# -----------------------------------------------------------
def _bezier_ribbon(ax, x0, y0_top, y0_bot, x1, y1_top, y1_bot, color, alpha=0.55):
    xm = (x0 + x1) / 2
    verts = [
        (x0, y0_top),
        (xm, y0_top),
        (xm, y1_top),
        (x1, y1_top),
        (x1, y1_bot),
        (xm, y1_bot),
        (xm, y0_bot),
        (x0, y0_bot),
        (x0, y0_top),
    ]
    codes = [
        Path.MOVETO,
        Path.CURVE4,
        Path.CURVE4,
        Path.CURVE4,
        Path.LINETO,
        Path.CURVE4,
        Path.CURVE4,
        Path.CURVE4,
        Path.CLOSEPOLY,
    ]
    patch = mpatches.PathPatch(
        Path(verts, codes), facecolor=color, edgecolor="none", alpha=alpha, lw=0
    )
    ax.add_patch(patch)


def draw_ribbon_sankey(
    ax,
    left_labels,
    left_colors,
    right_labels,
    flow_matrix,
    node_width=0.045,
    node_gap=0.025,
    right_order=None,
):
    left_totals = {
        l: sum(flow_matrix.get((l, r), 0) for r in right_labels) for l in left_labels
    }
    right_totals = {
        r: sum(flow_matrix.get((l, r), 0) for l in left_labels) for r in right_labels
    }
    grand_total = sum(left_totals.values()) or 1
    if right_order is None:
        right_order = sorted(right_labels, key=lambda r: right_totals[r], reverse=True)

    def node_positions(labels, totals):
        n = len(labels)
        gaps = node_gap * (n - 1) if n > 1 else 0
        usable = 1.0 - gaps
        positions = {}
        y = 1.0
        for lab in labels:
            h = (totals[lab] / grand_total) * usable if grand_total else 0
            positions[lab] = (y - h, y)
            y = y - h - node_gap
        return positions

    left_pos = node_positions(left_labels, left_totals)
    right_pos = node_positions(right_order, right_totals)
    x_left, x_right = 0.06, 1 - 0.06
    left_cursor = {l: left_pos[l][1] for l in left_labels}
    right_cursor = {r: right_pos[r][1] for r in right_order}
    n_left_gaps = node_gap * (len(left_labels) - 1) if len(left_labels) > 1 else 0

    for l in left_labels:
        for r in right_order:
            val = flow_matrix.get((l, r), 0)
            if val <= 0:
                continue
            h = (val / grand_total) * (1.0 - n_left_gaps)
            ly_top, ly_bot = left_cursor[l], left_cursor[l] - h
            left_cursor[l] = ly_bot
            ry_top, ry_bot = right_cursor[r], right_cursor[r] - h
            right_cursor[r] = ry_bot
            _bezier_ribbon(
                ax,
                x_left + node_width,
                ly_top,
                ly_bot,
                x_right - node_width,
                ry_top,
                ry_bot,
                color=left_colors[l],
                alpha=0.55,
            )

    for l in left_labels:
        bot, top = left_pos[l]
        ax.add_patch(
            mpatches.Rectangle(
                (x_left, bot),
                node_width,
                top - bot,
                facecolor=left_colors[l],
                edgecolor="white",
                linewidth=1.2,
                zorder=3,
            )
        )
        ax.text(
            x_left - 0.015,
            (top + bot) / 2,
            f"{l}\n{int(left_totals[l]):,}",
            ha="right",
            va="center",
            fontsize=9.5,
            fontweight="bold",
            color=TITLE_COLOR,
        )
    for r in right_order:
        bot, top = right_pos[r]
        ax.add_patch(
            mpatches.Rectangle(
                (x_right - node_width, bot),
                node_width,
                top - bot,
                facecolor="#7F8C8D",
                edgecolor="white",
                linewidth=1.2,
                zorder=3,
            )
        )
        ax.text(
            x_right + 0.015,
            (top + bot) / 2,
            f"{r}\n{int(right_totals[r]):,}",
            ha="left",
            va="center",
            fontsize=9.5,
            fontweight="bold",
            color=TITLE_COLOR,
        )
    ax.set_xlim(-0.38, 1.38)
    ax.set_ylim(0, 1.02)
    ax.axis("off")


def _add_report_header(fig, subtitle):
    fig.text(
        0.5,
        0.975,
        "Cocoa Field Evaluation",
        fontsize=19,
        fontweight="bold",
        color=TITLE_COLOR,
        ha="center",
    )
    fig.text(
        0.5,
        0.945,
        subtitle,
        fontsize=13,
        fontweight="medium",
        color=SUBTITLE_COLOR,
        ha="center",
    )


# -----------------------------------------------------------
# CHART FUNCTIONS (updated to include Cashew)
# -----------------------------------------------------------
CROP_LIST = ["Cocoa", "Oil Palm", "Plantain", "Cashew"]


def generate_crop_breakdown_chart(location_summary, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    crop_totals = [location_summary[f"Total {c}"].sum() for c in CROP_LIST]
    crop_colors = [CROP_COLORS[c] for c in CROP_LIST]
    status_data = {
        crop: [location_summary[f"Total {crop} {s}"].sum() for s in STATUSES]
        for crop in CROP_LIST
    }

    fig = plt.figure(figsize=(12, 12), facecolor="white")
    _add_report_header(fig, "Crop Breakdown")
    ax_pie = fig.add_axes([0.15, 0.55, 0.7, 0.34])
    wedges, texts, autotexts = ax_pie.pie(
        crop_totals,
        labels=None,
        colors=crop_colors,
        autopct="%1.1f%%",
        pctdistance=0.8,
        startangle=90,
        wedgeprops={"edgecolor": "white", "linewidth": 2, "width": 0.42},
        textprops={"fontsize": 10, "fontweight": "bold", "color": "white"},
    )
    ax_pie.text(
        0,
        0,
        f"{int(sum(crop_totals)):,}\ntrees",
        ha="center",
        va="center",
        fontsize=13,
        fontweight="bold",
        color=TITLE_COLOR,
    )
    ax_pie.set_title(
        "Crop Distribution (Total Trees)", fontsize=13, fontweight="bold", pad=16
    )
    ax_pie.legend(
        wedges,
        CROP_LIST,
        loc="center",
        bbox_to_anchor=(0.5, -0.12),
        ncol=4,
        frameon=False,
        fontsize=10,
    )

    ax_col = fig.add_axes([0.1, 0.08, 0.85, 0.36])
    x = np.arange(len(CROP_LIST))
    width = 0.15
    for i, status in enumerate(STATUSES):
        vals = [status_data[crop][i] for crop in CROP_LIST]
        offset = (i - len(STATUSES) / 2) * width + width / 2
        bars = ax_col.bar(
            x + offset,
            vals,
            width,
            label=status,
            color=STATUS_COLORS[i],
            edgecolor="white",
            linewidth=0.5,
        )
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax_col.text(
                    bar.get_x() + bar.get_width() / 2,
                    height + max(vals) * 0.015,
                    f"{int(height):,}",
                    ha="center",
                    va="bottom",
                    fontsize=7,
                    rotation=90,
                )
    ax_col.set_xticks(x)
    ax_col.set_xticklabels(CROP_LIST, fontsize=11, fontweight="bold")
    ax_col.set_ylabel("Number of Trees", fontsize=11)
    ax_col.set_title(
        "Status Breakdown per Crop", fontsize=13, fontweight="bold", pad=12
    )
    ax_col.grid(axis="y", linestyle="--", alpha=0.5)
    ax_col.set_axisbelow(True)
    for spine in ["top", "right"]:
        ax_col.spines[spine].set_visible(False)
    ax_col.legend(loc="upper right", frameon=True, fontsize=9)
    plt.savefig(
        os.path.join(output_dir, "Crop Breakdown.png"),
        dpi=200,
        bbox_inches="tight",
        facecolor="white",
    )
    plt.close()
    logger.info("Crop breakdown chart saved.")


def generate_location_crop_status_chart(location_summary, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    locations = location_summary["Location"].tolist()
    n_locations = len(locations)
    ncols = 3 if n_locations > 4 else 2 if n_locations > 1 else 1
    nrows = math.ceil(n_locations / ncols)
    fig, axes = plt.subplots(
        nrows, ncols, figsize=(6.5 * ncols, 5 * nrows), facecolor="white"
    )
    axes = np.atleast_1d(axes).flatten()
    _add_report_header(fig, "Crop Status Breakdown by Location")
    x = np.arange(len(CROP_LIST))
    width = 0.15
    legend_handles = None
    for idx, location in enumerate(locations):
        ax = axes[idx]
        row = location_summary[location_summary["Location"] == location].iloc[0]
        status_data = {
            crop: [row[f"Total {crop} {s}"] for s in STATUSES] for crop in CROP_LIST
        }
        for i, status in enumerate(STATUSES):
            vals = [status_data[crop][i] for crop in CROP_LIST]
            offset = (i - len(STATUSES) / 2) * width + width / 2
            bars = ax.bar(
                x + offset,
                vals,
                width,
                label=status,
                color=STATUS_COLORS[i],
                edgecolor="white",
                linewidth=0.5,
            )
            for bar in bars:
                height = bar.get_height()
                if height > 0:
                    ax.text(
                        bar.get_x() + bar.get_width() / 2,
                        height + max(vals) * 0.02,
                        f"{int(height):,}",
                        ha="center",
                        va="bottom",
                        fontsize=6,
                        rotation=90,
                    )
        ax.set_xticks(x)
        ax.set_xticklabels(CROP_LIST, fontsize=10, fontweight="bold")
        ax.set_title(location, fontsize=12, fontweight="bold", pad=10)
        ax.set_ylabel("Number of Trees", fontsize=9)
        ax.grid(axis="y", linestyle="--", alpha=0.5)
        ax.set_axisbelow(True)
        for spine in ["top", "right"]:
            ax.spines[spine].set_visible(False)
        if legend_handles is None:
            legend_handles, legend_labels = ax.get_legend_handles_labels()
    for ax in axes[n_locations:]:
        ax.axis("off")
    fig.legend(
        legend_handles,
        legend_labels,
        loc="upper center",
        bbox_to_anchor=(0.5, 0.9),
        ncol=len(STATUSES),
        frameon=False,
        fontsize=10,
    )
    plt.tight_layout(rect=[0, 0, 1, 0.87])
    plt.savefig(
        os.path.join(output_dir, "Crop Status Breakdown by Location.png"),
        dpi=200,
        bbox_inches="tight",
        facecolor="white",
    )
    plt.close()
    logger.info("Crop status breakdown by location chart saved.")


def generate_location_distribution_chart(aggregated_df, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    agg_cols = [f"Total {c}" for c in CROP_LIST]
    loc_df = aggregated_df.groupby("Location", as_index=False).agg(
        {col: "sum" for col in agg_cols if col in aggregated_df.columns}
    )
    loc_df["Total Trees"] = loc_df[agg_cols].sum(axis=1)
    loc_df = loc_df.sort_values("Total Trees", ascending=False)
    locations = loc_df["Location"].tolist()
    location_trees = loc_df["Total Trees"].tolist()
    num_locs = len(locations)
    loc_colors = plt.cm.Set3(np.linspace(0, 1, max(num_locs, 3)))
    fig = plt.figure(figsize=(14, 13), facecolor="white")
    _add_report_header(fig, "Location Distribution")
    ax_pie = fig.add_axes([0.18, 0.56, 0.64, 0.36])
    wedges, texts, autotexts = ax_pie.pie(
        location_trees,
        labels=None,
        colors=loc_colors,
        autopct="%1.1f%%",
        pctdistance=0.8,
        startangle=90,
        wedgeprops={"edgecolor": "white", "linewidth": 2, "width": 0.42},
        textprops={"fontsize": 9, "fontweight": "bold", "color": "#2C3E50"},
    )
    ax_pie.text(
        0,
        0,
        f"{int(sum(location_trees)):,}\ntrees",
        ha="center",
        va="center",
        fontsize=13,
        fontweight="bold",
        color=TITLE_COLOR,
    )
    ax_pie.set_title(
        "Location Share of Total Trees", fontsize=13, fontweight="bold", pad=16
    )
    ax_pie.legend(
        wedges,
        locations,
        loc="center",
        bbox_to_anchor=(0.5, -0.14),
        ncol=min(4, num_locs),
        frameon=False,
        fontsize=9,
    )
    ax_sankey = fig.add_axes([0.03, 0.02, 0.94, 0.46])
    flow_matrix = {}
    for crop in CROP_LIST:
        col_name = f"Total {crop}"
        for _, row in loc_df.iterrows():
            flow_matrix[(crop, row["Location"])] = row[col_name]
    draw_ribbon_sankey(ax_sankey, CROP_LIST, CROP_COLORS, locations, flow_matrix)
    ax_sankey.set_title(
        "Crop → Location Tree Flow",
        fontsize=13,
        fontweight="bold",
        color=TITLE_COLOR,
        pad=6,
        y=1.02,
    )
    plt.savefig(
        os.path.join(output_dir, "Location Distribution.png"),
        dpi=200,
        bbox_inches="tight",
        facecolor="white",
    )
    plt.close()
    logger.info("Location distribution chart saved.")


def generate_enumerator_chart(enum_df, output_dir):
    if enum_df is None or enum_df.empty:
        logger.warning("No enumerator data. Skipping chart.")
        return
    os.makedirs(output_dir, exist_ok=True)
    enum_df = enum_df.sort_values("Total Trees", ascending=True)
    fig, ax = plt.subplots(figsize=(10, max(5, len(enum_df) * 0.7)), facecolor="white")
    _add_report_header(fig, "Enumerator Summary")
    y_pos = range(len(enum_df))
    crops_cols = [f"Total {c}" for c in CROP_LIST]
    crop_colors = [CROP_COLORS[c] for c in CROP_LIST]
    max_val = enum_df[crops_cols].max().max() * 1.15
    for i, (_, row) in enumerate(enum_df.iterrows()):
        vals = [row[c] for c in crops_cols]
        ax.plot([min(vals), max(vals)], [i, i], color="#D5D8DC", lw=2, zorder=1)
    for i, (_, row) in enumerate(enum_df.iterrows()):
        for j, col in enumerate(crops_cols):
            val = row[col]
            ax.plot(
                val,
                i,
                "o",
                color=crop_colors[j],
                markersize=11,
                markeredgewidth=1,
                markeredgecolor="white",
                zorder=2,
            )
            ax.text(
                val,
                i + 0.22,
                f"{int(val)}",
                va="bottom",
                ha="center",
                fontsize=8,
                color=SUBTITLE_COLOR,
            )
    ax.set_yticks(y_pos)
    ax.set_yticklabels(enum_df["Enumerator"], fontsize=10, fontweight="bold")
    ax.set_xlim(0, max_val)
    ax.set_xlabel("Number of Trees", fontsize=11)
    ax.grid(axis="x", linestyle="--", alpha=0.5)
    ax.set_axisbelow(True)
    for spine in ["top", "right", "left"]:
        ax.spines[spine].set_visible(False)
    legend_elements = [
        mpatches.Patch(color=crop_colors[i], label=CROP_LIST[i])
        for i in range(len(CROP_LIST))
    ]
    ax.legend(handles=legend_elements, loc="lower right", frameon=True, fontsize=9)
    plt.tight_layout(rect=[0, 0, 1, 0.91])
    plt.savefig(
        os.path.join(output_dir, "Enumerator Summary.png"),
        dpi=200,
        bbox_inches="tight",
        facecolor="white",
    )
    plt.close()
    logger.info("Enumerator summary chart saved.")


# -----------------------------------------------------------
# AGGREGATION (Cashew added, duplicate columns handled)
# -----------------------------------------------------------
def aggregate_data(df):
    existing = [c for c in COLS_TO_KEEP if c in df.columns]
    if not existing:
        raise ValueError("None of the expected columns were found.")
    df = df[existing].copy()

    # Remove duplicate column names
    df = df.loc[:, ~df.columns.duplicated()]

    if "heading/location" in df.columns:
        df["heading/location"] = df["heading/location"].apply(clean_location)
    if "heading/block" not in df.columns:
        raise ValueError("Column 'heading/block' not found.")
    df["Block"] = df["heading/block"].apply(clean_block)
    df = df.dropna(subset=["Block"])
    df["Block"] = df["Block"].astype(int)
    rename_map = {k: v for k, v in RENAME_MAP.items() if k != "heading/block"}
    df.rename(columns=rename_map, inplace=True)
    df.drop(columns=["heading/block"], inplace=True, errors="ignore")

    for col in NUMERIC_COLS:
        if col in df.columns:
            series = (
                df[col].iloc[:, 0] if isinstance(df[col], pd.DataFrame) else df[col]
            )
            df[col] = pd.to_numeric(series, errors="coerce")

    agg_funcs = {}
    for col in NUMERIC_COLS:
        if col in df.columns:
            agg_funcs[col] = "sum"
    for col in META_COLS:
        if col in df.columns:
            agg_funcs[col] = lambda x: (
                x.dropna().iloc[0] if not x.dropna().empty else None
            )
    if "Enumerator Name" in df.columns:
        agg_funcs["Enumerator Name"] = lambda x: ", ".join(x.dropna().unique())
    grouped = df.groupby(["Location", "Block"], as_index=False).agg(agg_funcs)
    final_cols = (
        [
            "Location",
            "Block",
            "Farm Size",
            "Block Size",
            "GPS Latitude",
            "GPS Longitude",
        ]
        + NUMERIC_COLS
        + ["Enumerator Name"]
    )
    final_cols = [c for c in final_cols if c in grouped.columns]
    return grouped[final_cols]


def generate_enumerator_summary(raw_df):
    if "conclusion/enumeratorName" not in raw_df.columns:
        return None
    keep = [
        "conclusion/enumeratorName",
        "totalFarmers",
        "totalCocoa",
        "totaloilPalm",
        "totalplantain",
        "totalcashew",
    ]
    existing = [c for c in keep if c in raw_df.columns]
    df_enum = raw_df[existing].copy()
    df_enum = df_enum.loc[:, ~df_enum.columns.duplicated()]
    df_enum["Enumerator"] = df_enum["conclusion/enumeratorName"].apply(clean_enumerator)
    numeric_cols = [
        c
        for c in [
            "totalFarmers",
            "totalCocoa",
            "totaloilPalm",
            "totalplantain",
            "totalcashew",
        ]
        if c in df_enum.columns
    ]
    for col in numeric_cols:
        series = (
            df_enum[col].iloc[:, 0]
            if isinstance(df_enum[col], pd.DataFrame)
            else df_enum[col]
        )
        df_enum[col] = pd.to_numeric(series, errors="coerce")

    rename = {
        "totalFarmers": "Total Farmers",
        "totalCocoa": "Total Cocoa",
        "totaloilPalm": "Total Oil Palm",
        "totalplantain": "Total Plantain",
        "totalcashew": "Total Cashew",
    }
    enum_summary = df_enum.groupby("Enumerator", as_index=False).agg(
        {col: "sum" for col in numeric_cols}
    )
    enum_summary.rename(
        columns={k: v for k, v in rename.items() if k in numeric_cols}, inplace=True
    )
    tree_cols = [
        v
        for k, v in rename.items()
        if k in ["totalCocoa", "totaloilPalm", "totalplantain", "totalcashew"]
        and v in enum_summary.columns
    ]
    enum_summary["Total Trees"] = enum_summary[tree_cols].sum(axis=1)
    enum_summary = enum_summary.sort_values("Total Trees", ascending=False).reset_index(
        drop=True
    )
    final_cols = (
        ["Enumerator", "Total Trees"]
        + [c for c in tree_cols if c != "Total Trees"]
        + ["Total Farmers"]
    )
    return enum_summary[[c for c in final_cols if c in enum_summary.columns]]


def generate_location_summary(aggregated_df):
    loc_df = aggregated_df.groupby("Location", as_index=False).agg(
        {col: "sum" for col in NUMERIC_COLS if col in aggregated_df.columns}
    )
    tree_types = [f"Total {c}" for c in CROP_LIST]
    existing_trees = [t for t in tree_types if t in loc_df.columns]
    if existing_trees:
        loc_df["Total Trees"] = loc_df[existing_trees].sum(axis=1)
    else:
        loc_df["Total Trees"] = 0
    numeric_cols_present = [c for c in NUMERIC_COLS if c in loc_df.columns]
    col_order = ["Location"] + numeric_cols_present + ["Total Trees"]
    return loc_df[[c for c in col_order if c in loc_df.columns]]


def generate_summary_by_location(aggregated_df):
    """
    Create a location summary using only the first word of each Location.
    All numeric columns are summed.
    """
    df = aggregated_df.copy()

    def first_word(loc):
        if not isinstance(loc, str):
            return "Unknown"
        cleaned = re.sub(r"[^a-zA-Z0-9]", " ", loc)
        parts = cleaned.split()
        return parts[0].title() if parts else "Unknown"

    df["Location"] = df["Location"].apply(first_word)

    numeric_cols = [
        col
        for col in df.columns
        if col
        not in [
            "Location",
            "Block",
            "Farm Size",
            "Block Size",
            "GPS Latitude",
            "GPS Longitude",
            "Enumerator Name",
        ]
        and pd.api.types.is_numeric_dtype(df[col])
    ]

    summary = df.groupby("Location", as_index=False)[numeric_cols].sum()

    tree_cols = [c for c in numeric_cols if "Total" in c and "Farmers" not in c]
    if tree_cols:
        summary["Total Trees"] = summary[tree_cols].sum(axis=1)

    return summary


# -----------------------------------------------------------
# MAIN
# -----------------------------------------------------------
def main():
    logger.info("Starting Cocoa Field Evaluation Pipeline")
    if len(sys.argv) < 8:
        log_step("error", "failed", "Missing arguments")
        sys.exit(1)

    api_key = sys.argv[1]
    base_url = sys.argv[2]
    form_id = sys.argv[3]
    sheet_name = sys.argv[4]
    creds_path = sys.argv[5]
    spreadsheet_config_path = sys.argv[6]
    spreadsheet_key = sys.argv[7]
    generate_charts = sys.argv[8].lower() == "true" if len(sys.argv) > 8 else False

    # ---------- Step 1: Download ----------
    logger.info("Downloading form data…")
    log_step("download", "running", "Downloading form data…")
    try:
        options = (
            "labels_only=true&include_images=false&do_not_split_multi_selects=true"
        )
        url = f"{base_url}/data/{form_id}.xlsx?{options}"
        resp = requests.get(
            url, headers={"Authorization": f"Token {api_key}"}, timeout=120
        )
        resp.raise_for_status()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        tmp.write(resp.content)
        tmp.close()
        logger.info(f"Downloaded {len(resp.content)} bytes")
        log_step("download", "complete", f"Downloaded form {form_id}")
    except Exception as e:
        logger.error(f"Download failed: {e}")
        log_step("download", "failed", str(e))
        sys.exit(1)

    # ---------- Step 2: Clean & Process ----------
    logger.info("Cleaning data…")
    log_step("clean", "running", "Cleaning data…")
    try:
        df = pd.read_excel(tmp.name, sheet_name=0, dtype=str)
        logger.info(f"Initial rows: {len(df)}")

        aggregated = aggregate_data(df)
        logger.info(f"Aggregated rows: {len(aggregated)}")

        enumerator_summary = generate_enumerator_summary(df)
        location_summary = generate_location_summary(aggregated)
        summary_by_location = generate_summary_by_location(aggregated)
        logger.info(f"Simple location summary rows: {len(summary_by_location)}")

        if enumerator_summary is not None:
            logger.info(f"Enumerator summary rows: {len(enumerator_summary)}")
        else:
            logger.info("Enumerator summary skipped (no enumerator column)")

        if generate_charts:
            logger.info("Generating charts…")
            generate_crop_breakdown_chart(location_summary, OUTPUT_DIR)
            generate_location_crop_status_chart(location_summary, OUTPUT_DIR)
            generate_location_distribution_chart(aggregated, OUTPUT_DIR)
            generate_enumerator_chart(enumerator_summary, OUTPUT_DIR)
            logger.info("Charts saved to output directory")
        else:
            logger.info("Charts skipped")

        log_step(
            "clean",
            "complete",
            f"Processed {len(aggregated)} records (charts: {generate_charts})",
        )
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        traceback.print_exc()
        log_step("clean", "failed", str(e))
        sys.exit(1)

    # ---------- Step 3: Upload ----------
    if spreadsheet_key and spreadsheet_key.strip():
        base_sheet = (
            sheet_name.strip() if sheet_name and sheet_name.strip() else "CocoaEval"
        )
        data_sheet_name = f"{base_sheet}_Data"
        enum_sheet_name = f"{base_sheet}_Enumerator"
        summary_sheet_name = f"{base_sheet}_Summary"
        
        log_step(
            "upload",
            "running",
            f"Uploading to {data_sheet_name}, {enum_sheet_name} & {summary_sheet_name}…",
        )
        try:
            with open(spreadsheet_config_path, "r") as f:
                config = json.load(f)
            spreadsheet_id = config.get(spreadsheet_key)
            if not spreadsheet_id:
                raise ValueError(f"Spreadsheet key '{spreadsheet_key}' not found")
            with open(creds_path, "r") as f:
                creds_json = json.load(f)
            scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive",
            ]
            credentials = ServiceAccountCredentials.from_json_keyfile_dict(
                creds_json, scope
            )
            client = gspread.authorize(credentials)

            # Upload aggregated data
            sheet_data = client.open_by_key(spreadsheet_id).worksheet(data_sheet_name)
            sheet_data.clear()
            gd.set_with_dataframe(sheet_data, aggregated)
            logger.info(f"Uploaded {len(aggregated)} rows to '{data_sheet_name}'")

            # Upload enumerator summary
            if enumerator_summary is not None and not enumerator_summary.empty:
                sheet_enum = client.open_by_key(spreadsheet_id).worksheet(
                    enum_sheet_name
                )
                sheet_enum.clear()
                gd.set_with_dataframe(sheet_enum, enumerator_summary)
                logger.info(
                    f"Uploaded {len(enumerator_summary)} rows to '{enum_sheet_name}'"
                )
            else:
                logger.info("Enumerator summary empty, skipping upload for it.")

            # Upload simple location summary
            sheet_summary = client.open_by_key(spreadsheet_id).worksheet(
                summary_sheet_name
            )
            sheet_summary.clear()
            gd.set_with_dataframe(sheet_summary, summary_by_location)
            logger.info(
                f"Uploaded {len(summary_by_location)} rows to '{summary_sheet_name}'"
            )

            log_step(
                "upload",
                "complete",
                f"Uploaded to {data_sheet_name}, {enum_sheet_name} & {summary_sheet_name}",
            )
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            log_step("upload", "failed", str(e))
    else:
        logger.info("No upload configured")
        log_step("upload", "complete", "No upload needed")

    if os.path.exists(tmp.name):
        os.unlink(tmp.name)

    logger.info("Cocoa Field Evaluation Pipeline completed successfully")


if __name__ == "__main__":
    main()
