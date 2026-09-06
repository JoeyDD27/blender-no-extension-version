# Blender — No Extension Version

This project overlays [Stabfish 2](https://stabfish2.io/) on a website in the
same Chrome tab. It uses a DevTools Snippet and does not require a browser
extension.

Everything runs locally in your browser. The snippet does not read, copy, or
send data from the website underneath it.

> Use this only in a browser profile you own or are allowed to modify. Local
> header overrides weaken a site's normal browser protections while enabled.

## Limitations

- The setup must be completed separately in every Chrome profile and on every
  computer.
- A new underlying website may require its own CSP header override.
- The snippet must be run again after a full page reload or navigation.
- Some websites prohibit being embedded or may break when their security
  headers are changed.
- Stabfish login inside the overlay depends on its cookie and iframe policies.
- Keyboard shortcuts work when the underlying website has focus. A parent page
  cannot receive keyboard events while a cross-origin Stabfish iframe has
  focus, so use the visible **Swap** button to return to the underlying website.

## First-time setup

### 1. Sign into Stabfish

1. Use a normal Chrome window, not Incognito.
2. Open <https://stabfish2.io/> directly.
3. Sign into your Stabfish account.
4. Leave that tab open temporarily.

### 2. Allow Stabfish cookies in the overlay

1. Open the website you want underneath Stabfish.
2. Select the cookie/site-information icon beside Chrome's address bar.
3. Enable third-party cookies for that website.
4. Reload the page.

Alternatively, open **Chrome Settings → Privacy and security → Third-party
cookies → Sites allowed to use third-party cookies**, then add:

```text
[*.]stabfish2.io
```

### 3. Allow the Stabfish frame when CSP blocks it

Try running the snippet first. If the Console reports that `frame-src` blocked
`https://stabfish2.io/`, create a local header override:

1. Keep DevTools open and select **Network**.
2. Enable **Keep log**, select **Doc**, and reload the underlying website.
3. Select the newest request whose name matches the underlying website and has
   status `200` and type `document`.
4. Right-click it and select **Override headers**.
5. The first time Chrome asks, create an empty folder such as
   `Website-overrides`, select it, and grant access.
6. If needed, right-click the document request and select **Override headers**
   again.
7. Open **Headers → Response Headers** and find
   `Content-Security-Policy`.
8. In its existing `frame-src` directive, add this source without deleting the
   other sources:

   ```text
   https://stabfish2.io
   ```

   For example:

   ```text
   frame-src 'self' data: https://stabfish2.io https://existing-example.com;
   ```

9. If the policy has no `frame-src` directive, append:

   ```text
   frame-src 'self' data: https://stabfish2.io;
   ```

10. Press **Enter**, save with **Command+S**, and reload the website while
    DevTools remains open.

Do not paste one website's complete CSP into a different website. Preserve the
selected website's policy and add only the Stabfish source.

### 4. Install the DevTools Snippet

1. Open DevTools with `F12` or `Option+Command+I`.
2. Open **Sources → Snippets**. It may be inside the `»` menu.
3. Create a new snippet named `Stabfish Blender`.
4. Copy all of [`stabfish-console-snippet.js`](./stabfish-console-snippet.js)
   into the snippet.
5. Save with **Command+S**.
6. Run it with **Command+Enter**.

The control bar appears at the bottom of the page.

## Second time

1. Use the same Chrome profile.
2. Open the previously configured underlying website.
3. Open DevTools.
4. Check **Sources → Overrides → Enable Local Overrides** if the website needs
   the CSP override.
5. Reload the website.
6. Open **Sources → Snippets → Stabfish Blender**.
7. Press **Command+Enter**.

You normally do not need to edit the header or reinstall the snippet again.

## Third time and every later time

1. Open the previously configured underlying website.
2. Open DevTools.
3. Reload the website so its saved override is applied.
4. Open **Sources → Snippets → Stabfish Blender**.
5. Press **Command+Enter**.

Run the snippet again after a full reload, closing the tab, or navigating to a
new page.

## Using a completely new underlying website

1. Open the new website.
2. Open DevTools and run the saved snippet.
3. If Stabfish loads, no additional CSP work is required.
4. If the Console reports a `frame-src` CSP error, repeat the first-time CSP
   override steps for that website's main document request.

## Controls

- **Percentage slider:** adjusts the selected website/Stabfish blend.
- **Swap:** switches which layer receives mouse and keyboard input.
- **Dark:** applies the dark filter to either layer.
- **Command+K:** shows or hides the control bar.
- **Command+X:** Emergency mode—instantly makes the selected website 100%
  visible and returns control to it.

`Ctrl+K` and `Ctrl+X` provide the same controls on Windows and Linux.

Because `Command+X` normally means Cut, Cut is unavailable on the underlying
page while the blender snippet is installed.

## Console API

The snippet also provides these commands:

```js
__stabfishTabBlender.setPercentage(60);
__stabfishTabBlender.controlStabfish();
__stabfishTabBlender.controlPage();
__stabfishTabBlender.emergency();
__stabfishTabBlender.hideControls();
__stabfishTabBlender.showControls();
__stabfishTabBlender.destroy();
```

## Removing the blender

Run this in the Console:

```js
__stabfishTabBlender.destroy();
```

When finished testing, open **Sources → Overrides** and turn off **Enable Local
Overrides** to restore the website's normal response headers.
