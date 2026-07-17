# Lucky Winner Power — Android wrappers

Two lightweight Android WebView apps that wrap the deployed site. They always
show the live production build (nothing is bundled), so publishing a new web
deploy updates both apps automatically.

Two product flavors build two separate apps:

| Flavor   | App name             | applicationId            | Loads                                          |
| -------- | -------------------- | ------------------------ | ---------------------------------------------- |
| `player` | Lucky Winner Power   | `app.luckywinner.player` | `https://lucky-winner-power.vercel.app`        |
| `admin`  | Lucky Winner Admin   | `app.luckywinner.admin`  | `https://lucky-winner-power.vercel.app/admin`  |

The admin app opens the role-gated `/admin` portal; unauthenticated users are
redirected to the login page, and access is enforced server-side by role
(admin / active distributor), exactly like the website.

## Build

Requires the Android SDK (platform 34, build-tools 34.0.0) and JDK 17. Set the
SDK path in `local.properties` (`sdk.dir=/path/to/android-sdk`), then:

```bash
cd android
./gradlew assembleDebug          # both flavors, debug-signed (sideloadable)
```

Outputs:

- `app/build/outputs/apk/player/debug/app-player-debug.apk`
- `app/build/outputs/apk/admin/debug/app-admin-debug.apk`

## Release signing

Debug APKs are signed with the shared Android debug key and are fine for
sideloading/testing. For a Google Play release, create an upload keystore and
add a `signingConfigs` block plus `./gradlew assembleRelease`. A Play Console
account and store listing are also required.
