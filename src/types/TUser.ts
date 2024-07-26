type TUser = {
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    is_super_admin: boolean,
    role: string
}

export type TUserInfo = {
    firstname: string,
    lastname: string,
}

export type TChangePasswordData = {
    oldPassword: string,
    password: string,
    confirmPassword: string,
}

export type TUserCredentials = {
    email: string,
    password: string,
    is_super_admin: boolean,
    role: string
}

export type TUserEmail = {
    email: string,
    is_super_admin: boolean,
    role: string
}

export const DEFAULT_USER_INFO : TUserInfo = {
    firstname: '',
    lastname: ''
}

export default TUser;