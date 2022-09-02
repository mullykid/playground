export const HEADER_AUTH = "AuthTags"

export const ALL_TENANTS = "__ALL__"
export const NONE_TENANT = "__NONE__"

export function getVisibleAuthTags(tenants: string[]) {
    return tenants.filter( (v) => v!==ALL_TENANTS)
}