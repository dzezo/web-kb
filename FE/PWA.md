# PWA

## PWA Core Building Blocks

### Service Workers

Service Worker is JS background process that runs even when your application is closed.
They are used for:

- Caching/Offline support
- Enable other PWA features
  - Background Sync - Sync user data once internet connection is established
  - Web Push - Mobile-like push notifications

### Application Manifest

This is one single file that you can use to pass some extra information to your browser. Browser can take this information to display some things about your application differently, and depending on OS allow you to intall aplication on your home screen.

### Native API

API to access device native features like:

- Geolocation API - user location access
- Media API - device camera and microphone access

## Application Manifest

Create `manifest.json` in your root folder.
To use it add link tag in head of all your pages in case of MPA or just in `index.html` if you have SPA, like this:

```html
<link rel="manifest" href="/manifest.json" />
```

### Manifest Properties

`name` - Long name of app (e.g. on Splashscreen)
`short_name` - Short name of app (e.g. below icon)
`start_url` - Which page to load when user clicks on icon
`scope` - Which pages are include in PWA, `"."` means all pages
`display` - Should it look like standalone app, `"standalone"` means no browser controls
`background_color` - Color whilst loading and on Splashscreen
`theme_color` - Theme color (e.g. top bar in task switcher)
`description` - Description (e.g. as favorite)
`dir` - Read direction of your app
`lang` - Main language of app
`orientation` - Set (and enforce) default orientation
`icons` - Configure icons, system will chose the best-fitting one

```json
{
  "icons": [
    {
      "src": "/src/images/icons/app-icon-48x48.png",
      "type": "image/png",
      "sizes": "48x48"
    }
  ]
}
```

`related_applications` - Related native applications users might want to install, in case you have both Native and PWA

```json
{
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/..."
      "id": "com.example.app1"
    }
  ]
}
```
