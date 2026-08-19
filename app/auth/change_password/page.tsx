
import { getSession } from "@/lib/server/profile.actions";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePassword(){
    const user = await getSession();

    return <ChangePasswordForm userName={user.name} />
}
