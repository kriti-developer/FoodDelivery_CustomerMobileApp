# FoodExpress — Food Delivery App (Frontend)

A React Native (Expo) frontend for a food delivery app. The menu item and
order status come from a **real backend** over REST + Socket.IO (see
"Connecting to the Backend" below). Sign up/log in is still simulated
on-device with local storage — there is no auth backend yet.

## Tech Stack

- **Expo SDK 54** (React Native 0.81, React 19)
- **JavaScript** (no TypeScript)
- **React Navigation v6** — stack + bottom tab navigation
- **React Context** — global app state (auth, cart, order)
- **AsyncStorage** — persists the registered user and active session on-device
- **Socket.IO client** — live updates for the menu item and order status, pushed from the backend/dashboard

## Demo Scope

- 1 restaurant, 1 menu item — whichever one the restaurant dashboard currently has live
- 1 customer (you, after signing up)
- 1 delivery partner

## Features / Screens

| Screen | Description |
|---|---|
| Sign Up | Create a local account (name, email, phone, address, password) |
| Log In | Authenticate against the locally stored account |
| Home | Restaurant info and today's live menu item (updates instantly if the dashboard changes it) |
| Item Detail | Item info, quantity picker, add to cart |
| Cart | Review items, quantities, delivery address, order summary, place order against the backend |
| Orders | Order status (Placed → Accepted, more stages pending backend support), rider info once assigned, call button |
| Profile | Account details and log out |

## Project Structure

```
App.js                      Entry point — wraps the app in providers
src/
  config.js                  API_BASE — the backend's URL
  context/
    AppContext.js            Global state: auth (local), cart, live menu item + order (from backend)
  data/
    mockData.js              Restaurant info, delivery partner placeholder, order stage labels
  navigation/
    index.js                 Auth stack vs. main tab navigator, switches based on login state
  screens/
    LoginScreen.js
    SignupScreen.js
    HomeScreen.js
    ItemDetailScreen.js
    CartScreen.js
    OrdersScreen.js
    ProfileScreen.js
  components/
    PrimaryButton.js          Reusable button (solid/outline variants)
    QuantityStepper.js        Reusable +/- quantity control
  theme/
    colors.js                 Shared color palette
```

## Connecting to the Backend

This app expects a backend running `GET /api/menu/displayed`, `POST /api/orders`,
and Socket.IO events `menu:updated` / `order:updated`. Point the app at it by
editing `src/config.js`:

```js
export const API_BASE = "http://<your-backend-host>:<port>";
```

- If the backend is running on the same computer as Metro, use that computer's
  **LAN IP** (the same one you use for the Expo URL) — not `localhost`, since on
  a physical phone "localhost" means the phone itself.
- If the backend is exposed via a tunnel (ngrok, etc.), use that URL instead.
  Tunnel URLs are temporary — if the app suddenly can't reach the server,
  the tunnel likely expired and needs a fresh URL pasted in here.
- If `API_BASE` is unreachable, Home shows an empty "nothing on the menu"
  state and placing an order shows an error — it won't crash.

## Running the App

### 1. Install dependencies (first time only)

```
npm install
```

### 2. Start the dev server (Metro)

```
npx expo start
```

This starts Metro — the local dev server/bundler — on **port 8081**. It prints
a QR code and a `Logs for your project will appear below` line once it's
ready. Leave this terminal running while you work; it rebuilds the app
automatically every time you save a file.

### 3. Open the app

You have three options, depending on what you have available:

- **Your phone (recommended, easiest):**
  1. Install **Expo Go** from the App Store (iOS) or Play Store (Android).
  2. Make sure your phone is on the **same Wi-Fi network** as your computer.
  3. Scan the QR code Metro printed in the terminal (Android: use Expo Go's
     scanner; iOS: use the Camera app).
  4. If you can't scan it, open Expo Go and choose "Enter URL manually," then
     type `exp://<your-computer's-LAN-IP>:8081`. To find your LAN IP:
     - Windows (PowerShell/cmd): `ipconfig` → look for "IPv4 Address" under
       your active Wi-Fi adapter (e.g. `192.168.0.5`).
     - Mac/Linux: `ifconfig` or `ipconfig getifaddr en0`.

- **Android emulator:** with the dev server running, press `a` in the terminal
  (requires Android Studio + an emulator already set up).

- **Web browser (quick look, not a true mobile preview):** press `w` in the
  terminal.

### 4. Can't connect from your phone?

If your phone and computer can't reach each other directly (different Wi-Fi,
VPN, restrictive firewall), stop the server (`Ctrl+C`) and restart with:

```
npx expo start --tunnel
```

This routes the connection through Expo's relay so it works across networks —
slower to load, but far more reliable than fighting network/firewall settings.

## How Auth Works (Still Local, No Auth Backend Yet)

- **Sign Up** stores your account (including password, for this demo only) in
  AsyncStorage on your device, then logs you in.
- **Log In** checks the email/password you enter against that stored account.
- Your session persists across app restarts until you tap **Log Out**.
- None of this is secure storage — it's a stand-in for a real auth API and
  should not be used as-is in production.
