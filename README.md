# FoodExpress — Food Delivery App (Frontend)

A React Native (Expo) frontend for a food delivery app. This is a **frontend-only**
demo: there is no backend yet, so all data (the restaurant, the menu item, the
delivery partner) is mocked locally. Authentication is also simulated entirely
on-device using local storage — there is no real server-side auth.

## Tech Stack

- **Expo SDK 54** (React Native 0.81, React 19)
- **JavaScript** (no TypeScript)
- **React Navigation v6** — stack + bottom tab navigation
- **React Context** — global app state (auth, cart, order)
- **AsyncStorage** — persists the registered user and active session on-device

## Demo Scope

- 6 mock restaurants, each with a couple of menu items (12 dishes total)
- 1 customer (you, after signing up)
- 1 delivery partner
- All dishes priced **free**

## Features / Screens

| Screen | Description |
|---|---|
| Sign Up | Create a local account (name, email, phone, address, password) |
| Log In | Authenticate against the locally stored account |
| Home | Search bar (restaurants or dishes), Top Rated restaurants, Previously Ordered dishes (once you've placed an order), and the full restaurant list |
| Restaurant | A restaurant's info and its menu |
| Item Detail | Item info, quantity picker, add to cart |
| Cart | Review items, quantities, delivery address, order summary, place order |
| Orders | Live order status (Placed → Preparing → Out for Delivery → Delivered), items in the order, delivery partner info and a call button |
| Profile | Account details and log out |

## Project Structure

```
App.js                      Entry point — wraps the app in providers
src/
  context/
    AppContext.js            Global state: auth, cart, active order + order history (+ AsyncStorage persistence)
  data/
    mockData.js              Mock restaurants, menu items, delivery partner, order stages, search/lookup helpers
  navigation/
    index.js                 Auth stack vs. main tab navigator, switches based on login state
  screens/
    LoginScreen.js
    SignupScreen.js
    HomeScreen.js
    RestaurantScreen.js
    ItemDetailScreen.js
    CartScreen.js
    OrdersScreen.js
    ProfileScreen.js
  components/
    PrimaryButton.js          Reusable button (solid/outline variants)
    QuantityStepper.js        Reusable +/- quantity control
    RestaurantCard.js         Restaurant row used on Home and search results
    DishCard.js                Dish row used on Home, Restaurant, and search results
  theme/
    colors.js                 Shared color palette
```

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
  terminal. Requires `react-native-web` and `react-dom`, which Expo will offer
  to install automatically the first time.

### 4. Can't connect from your phone?

If your phone and computer can't reach each other directly (different Wi-Fi,
VPN, restrictive firewall), stop the server (`Ctrl+C`) and restart with:

```
npx expo start --tunnel
```

This routes the connection through Expo's relay so it works across networks —
slower to load, but far more reliable than fighting network/firewall settings.

## How Auth Works (No Backend)

- **Sign Up** stores your account (including password, for this demo only) in
  AsyncStorage on your device, then logs you in.
- **Log In** checks the email/password you enter against that stored account.
- Your session persists across app restarts until you tap **Log Out**.
- None of this is secure storage — it's a stand-in for a real backend and should
  not be used as-is once a real auth API exists.

## Swapping in a Real Backend Later

All mock data lives in `src/data/mockData.js` and all app state logic lives in
`src/context/AppContext.js`. To connect a real backend, replace the
AsyncStorage calls and static imports in those two files with API calls — the
screens themselves don't need to change since they only consume the context.
