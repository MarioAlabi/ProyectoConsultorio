export const ROLES = Object.freeze({
    ADMIN: "admin",
    DOCTOR: "doctor",
    ASSISTANT: "assistant",
});

export const ROLE_HOME_PATHS = Object.freeze({
    [ROLES.ADMIN]: "/admin",
    [ROLES.DOCTOR]: "/doctor",
    [ROLES.ASSISTANT]: "/reception",
});
