---
title: "I Took Property Photos With My Phone and GeoStamp Saved the Location Metadata"
date: 2026-07-13
readingTime: 5 min
tags: [mobile, real-estate, GPS, property-photos]
---

# I Took Property Photos With My Phone and GeoStamp Saved the Location Metadata

## The Problem

I'm a real estate agent. Every week I visit 5-8 properties, take 30-60 photos with my iPhone, and send them to clients, listing platforms, and my team.

Here's what kept happening:

- I'd take 40 photos at a property showing
- Send the best 15 via WhatsApp to a client
- They'd ask "which house is this again?"
- I'd open the photos — the filenames were all `IMG_4921.jpeg`, none of them showed the address
- The GPS coordinates were buried in EXIF data that WhatsApp had already stripped

## Why Phone Photos Lose Location

When you take a photo with your phone, the GPS coordinates are embedded in the EXIF metadata. That's great — until you share that photo. Almost every messaging app strips EXIF data:

| App | Strips GPS EXIF? |
|-----|-----------------|
| WhatsApp | ✅ Yes |
| WeChat | ✅ Yes |
| Telegram (compressed) | ✅ Yes |
| iMessage | ⚠️ Sometimes |
| Email attachment | ⚠️ Depends on provider |
| Airdrop | ✅ Preserved |

So the GPS data that your phone carefully recorded is gone the moment you hit "send."

## My Fix: GeoStamp on Mobile Safari

Now I do this after every showing:

### Step 1: Shoot as usual

I take photos with my iPhone camera. The phone automatically records GPS coordinates into EXIF — I don't have to do anything special.

### Step 2: Open GeoStamp on my phone

I open Safari, go to `geostamp.top`, and tap "Upload Images." The web interface works perfectly on mobile — no app download needed.

### Step 3: Upload 2 minutes later

I select the photos I just took from my camera roll. GeoStamp reads the EXIF data (which is still intact because I haven't shared them yet) and displays the GPS coordinates and address for each photo.

### Step 4: Download stamped versions

I tap "Annotate All" and within seconds, every photo has a clean location stamp burned directly into the image — coordinates, address, date, and time, all visible on the photo itself.

### Step 5: Now share anything, anywhere

Once the location data is visible on the photo (not hidden in metadata), I can:

- Send via WhatsApp — the location info stays visible
- Upload to MLS listing platforms
- Drop into an email to a client
- Post on social media

The address is right there on the image. Nobody has to ask "which property is this?"

## A Real Example

Last week I listed a 3-bedroom in Westbrook. I took 28 photos during the walkthrough. Before GeoStamp, I would have organized them into folders named "Westbrook_3bd" and hoped that made sense. But a client forwarded one photo to her husband, who replied "where is this?" — even though I'd told them the address twice.

Now the address, coordinates, and date are stamped on the image. It's not hidden in metadata. It's visible.

## Why This Works for Mobile Users

- **No app install** — GeoStamp runs in the browser
- **Photos stay on your phone** — they're uploaded temporarily, stamped, and downloaded back
- **Zero setup** — your phone already records GPS; GeoStamp just makes it visible
- **Works on any smartphone** — iPhone, Android, whatever

## The Before and After

Before GeoStamp:
> IMG_4932.jpeg → "where was this?"

After GeoStamp:
> 123_Westbrook_2026-07-10.jpeg — with GPS stamp visible on the image → "oh, that's the living room at Westbrook"

One visible stamp saves five follow-up questions. For a real estate agent, that's time, and time is listings.
