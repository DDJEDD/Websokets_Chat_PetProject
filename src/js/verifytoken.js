export async function verifyToken() {

    try {
        const res = await fetch("/auth/refresh", {
            method: "POST",
            credentials: "include"
        });

        if (res.status === 401) {
            console.log("Token not found or expired. Login continues.");
            return false;
        }
        if (res.status == 404) {
            console.log("No token found. Login continues.");
            return false;
        }


        const data = await res.json();
        console.log("Token valid, user authenticated", data);
        return true;

    } catch (err) {
        console.error("Error verifying token:", err);
        return false;
    }
}
