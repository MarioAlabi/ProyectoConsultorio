/**
 * Calcula la edad a partir de una fecha de nacimiento (Date | string ISO).
 * @param {Date|string} dateOfBirth
 * @returns {number|null}
 */
export const calcularEdadFromDate = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
    return age;
};
