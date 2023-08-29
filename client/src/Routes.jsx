import Chat from "./Chat";
import RegisterAndLoginForm from "./RegisterAndLoginForm";
import { UserContext } from "./userContext";
import { useContext } from "react";

export default function Routes() {
    const {username, id, setUserName, setId} = useContext(UserContext);

    if(username) {
        return (
            <Chat/>
        );
    }
    return (
        <RegisterAndLoginForm/>
    )
}