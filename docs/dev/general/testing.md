# End-to-End Testing Overview

## Introduction

This project is tested through end-to-end (E2E) testing 
methodologies to guarantee the highest standards of quality and reliability
for its features. Our approach includes:

- **Playwright**: Utilized for automating browser interactions, Playwright 
  simulates real user actions to thoroughly test the entire application flow.
- **Percy**: Chosen for visual regression testing, Percy helps in capturing
  and comparing screenshots over time. This is crucial for detecting any
  unintended visual changes that may occur.
- **Mailtrap**: This tool is used to test email-related functionalities within
  the application.

## Continuous Integration

E2E tests are automatically triggered for each pull request (PR) into the main
branch, utilizing GitHub Actions for continuous integration (CI).

## Running E2E Tests Locally

To run the E2E tests locally, follow these steps:

1. **Environment Setup**: Ensure that the `.env` variables are set up in 
   `tests/.env`. Use `tests/.env.example` as a template for the required
   configuration.

2. **Execute Tests**:
   - Start the app (the specific command may vary based on your setup in the 
     previous steps).
   - Run `pnpm e2e:functional` to perform functional testing with Playwright.
   - Run `pnpm e2e:visual` for visual diffing with Percy.
