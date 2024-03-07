# README for BetterUptime Facturation Automation

## Overview

This program is designed to automate the tracking and reporting of uptime incidents, leveraging the Better Uptime API. It helps in managing incidents by filtering them based on specific criteria such as weekdays, weekends, and time ranges, and provides utilities for date management. Additionally, it fetches user calendars to monitor user activities within specified date ranges.

## Features

- **Date Utilities**: Functions to determine weekdays, weekends, get the last day of the month, and check if a date falls within a specified time range.
- **Incident Management**: Filter incidents occurring during specific time frames on weekdays and weekends.
- **User Calendar Management**: Fetch user calendars for a given date range and count weekdays and weekends.
- **Logging**: Utilizes `pino` for logging information, warnings, and errors.
- **Environment Variable Configuration**: Uses environment variables for API keys and endpoints to ensure security.

## Dependencies

- **Node.js**: The runtime environment to execute the application.
- **Pino**: A logging library for structured logging.
- **Lodash**: A utility library for manipulating and examining data.
- **Axios**: Used for making HTTP requests to the Better Uptime API.

## Setup

1. Ensure Node.js is installed on your system.
2. Clone the repository to your local machine.
3. Navigate to the project directory and run `npm install` to install the dependencies.
4. Set up the required environment variables:
    - `BETTERUPTIME_API_KEY`: Your Better Uptime API key.
    - `BETTERUPTIME_API_ENDPOINT`: The endpoint URL for the Better Uptime API.
    - `BETTERUPTIME_CALENDAR_ID`: The ID of the calendar to fetch from Better Uptime.
    - `BETTERUPTIME_WEEK_START_HOUR`: The start hours for the weeks day
    - `BETTERUPTIME_WEEK_END_HOUR`: The end hours for the weeks day
    - `BETTERUPTIME_WEEKEND_START_HOUR`: The start hours for the weekend days
    - `BETTERUPTIME_WEEKEND_END_HOUR`: The end hours for the weekend days


## Usage

Execute the script from the command line, providing the start and end dates as arguments:

```bash
node index.js --startDate YYYY-MM-DD --endDate YYYY-MM-DD
```

## Functions Overview

- **Date Management**: Includes utility functions like `getLastDayOfTheMonth`, `isWeekend`, `isWeekday`, and `isInTimeRange`.
- **Incident Filtering**: `filterAndLogIncidents` filters incidents based on day of the week and time range.
- **Calendar Fetching**: `fetchUserCalendars` fetches user calendars within a specified date range.
- **Logging**: Uses `pino` for efficient and structured logging throughout the application.
- **API Calls**: Utilizes Axios for asynchronous API calls to fetch calendar and incident data.

## Error Handling

The application includes error handling for API requests, invalid date ranges, and missing environment variables. Errors are logged using `pino`.

## Development To-Do
- Make the library agnostic and transform main.js into an example of how to use the library.
- Enable export to file functionality, allowing users to save reports or logs directly to a file.
- Allow functionality with or without on-call intervals, catering to different user needs and scenarios.
- Achieve 1K stars on GitHub, reflecting the community's recognition and trust in the library's value.❤️❤️❤️❤️

## Contributing

Contributions to enhance the functionality, improve efficiency, or fix bugs are welcome. Please follow the standard GitHub pull request process to submit your contributions.

## License

Specify the license under which this software is distributed. (e.g., MIT, GPL)

---

Note: This README provides a general overview and setup instructions for the BetterUptime Facturation Automation program. Modify and expand sections as necessary to suit the specific needs and structure of your project.