import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { openChatAssistant } from "../../common/components/chat/ChatAssistantFab";

export default function ChatLauncher({ destination = "/" }: { destination?: string }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    openChatAssistant(new URLSearchParams(location.search).get("message") ?? undefined);
    navigate(destination, { replace: true });
  }, [destination, location.search, navigate]);

  return null;
}
