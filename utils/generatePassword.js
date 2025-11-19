export function generateStrongPassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";

    // 1st letter capital
    let password = upper[Math.floor(Math.random() * upper.length)];

    // next 3 letters small
    for (let i = 0; i < 3; i++) {
        password += lower[Math.floor(Math.random() * lower.length)];
    }

    // add '@'
    password += "@";

    // add 3 numbers
    for (let i = 0; i < 3; i++) {
        password += digits[Math.floor(Math.random() * digits.length)];
    }

    return password;
}
