import TUser from "./TUser";

export function isAuthenticated(user: TUser|null) : boolean {
    //return user ? user.emailVerified : false;

    return user ? true : false;

}