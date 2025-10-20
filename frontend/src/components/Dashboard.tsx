import ChatInterface from "./ChatInterface";
import PastConversations from "./PastConversations";

const Dashboard = () => {
  return (
    <div className="h-screen v-screen flex flex-direction-row">
      <PastConversations/>
      <ChatInterface/>
    </div>
  );
};

export default Dashboard;
