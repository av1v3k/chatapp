import axios from "axios";
import { UserContextProvider } from "./userContext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = "http://localhost:4040";
  axios.defaults.withCredentials = true; //set cookies from API.
  return (
    <UserContextProvider>
      {/* <Register /> */}
      <Routes/>
    </UserContextProvider>
  );
}

export default App;
