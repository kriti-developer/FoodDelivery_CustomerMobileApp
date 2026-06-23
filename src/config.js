// Point this at the backend's LAN IP address - the same one you use for
// the Expo URL (exp://<IP>:8081). It can't be "localhost" here, because
// on a physical phone, "localhost" means the phone itself, not your computer.
//
// Find your computer's LAN IP (Mac: System Settings > Wi-Fi > Details,
// or run `ipconfig getifaddr en0` in a terminal) and put it below.
export const API_BASE = "http://192.168.0.5:4000";
