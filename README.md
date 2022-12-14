# Home Assistant Southeastern Rail Card by [@crismc](https://github.com/crismc)
A custom Home Assistant card for the Lovelace theme to show next available trains to specific stops through the National Rail Darwin API.
To be used with the Home Assistant custom component ha_southeasternrail (https://github.com/crismc/ha_southeasternrail)

[![License][license-shield]](LICENSE.md)

![alt text](https://raw.githubusercontent.com/crismc/ha-southeastern-rail-card/master/screenshot.png)

Based on the community driven boilerplate of best practices for Home Assistant Lovelace custom cards (Boilerplate Card by [@iantrich](https://www.github.com/iantrich) https://github.com/custom-cards/boilerplate-card)

## Options

| Name                 | Type    | Requirement  | Description                                            | Default             |
| ---------------------| ------- | ------------ | -------------------------------------------------------| ------------------- |
| type                 | string  | **Required** | `custom:southeastern-rail-card`                        |                     |
| name                 | string  | **Optional** | Card name based on entity                              | `none`              |
| show_error           | boolean | **Optional** | Show error message such as no service data             | `true`              |
| show_warning         | boolean | **Optional** | Show station alert messages                            | `true`              |
| show_via_destination | boolean | **Optional** | Show if train goes via an alternate route              | `true`              |
| show_callingpoints   | boolean | **Optional** | Show train service calling stops                       | `true`              |
| show_status          | boolean | **Optional** | Show service status (e.g. On Time, Delayed etc)        | `true`              |
| show_arrival_time    | boolean | **Optional** | Show train service arrival time at destination         | `true`              |
| show_departure_time  | boolean | **Optional** | Show train service departure time from primary station | `true`              |
| entity               | string  | **Optional** | Home Assistant entity ID.                              | `none`              |

## Installing the card from source

### Step 1

Clone the repository to your machine

### Step 2

Install necessary modules (verified to work in node 8.x)
`yarn install` or `npm install`

### Step 3

Do a test lint & build on the project. You can see available scripts in the package.json
`npm run build`

### Step 4

Copy content of <project_dir>/dist to your Home Assistant instance <config>/www/ha_southeastern-rail-card
If directories do not exist, create them.

### Step 5
Go to Settings > Dashboards, click the three dots menu in the top right and select Resources.
If you do not have the three dots, you will need to temporarily enable "Advanced Mode" within Profile

### Step 6
Choose "Add Resource" and enter the following:
   URL: /local/ha_southeastern-rail-card/southeastern-rail-card.js
   Resource Type: JavaScript Module

### Step 7
If you created the <config>/www directory, restart Home Assistant (Developer Tools > Restart)

[license-shield]: https://img.shields.io/github/license/custom-cards/boilerplate-card.svg?style=for-the-badge
