# Multidimensional Charts with Angular, D3.js, DC.js, and Crossfilter.js

This project is an Angular application that showcases the integration of [D3.js](https://d3js.org/), [DC.js](https://dc-js.github.io/dc.js/), and [Crossfilter.js](http://square.github.io/crossfilter/) to create interactive charts with cross-filtering capabilities. The project uses a dataset with `147,150 records` in the financial domain, allowing for advanced data visualization and analytics.

## Data Structure

Live Demo [here](https://andexit.github.io/Multidimensional-Charts)

## Data Structure

The dataset contains information about financial metrics, company details, and market trends. Here's a sample record from the dataset:

`{
  "rebalancing_date": "2022-04-05",
  "companyid": "135285",
  "pricingdate": "2022-06-30",
  "weight": "",
  "daily_return_eur": "-0.034000800000000005",
  "market_capitalization_usd": "1478.871127953167",
  "sector": "Information Technology",
  "country": "FRA",
  "currency": "EUR",
  "PRICECLOSEADJEUR": "12.785",
  "COMPANYNAME": "Atos SE"
}`

## Project Features
-Interconnected Charts: Use DC.js to create charts such as bar charts, pie charts, and scatter plots. These charts are interconnected, allowing for cross-filtering based on various attributes.
-Crossfilter.js Integration: Implement Crossfilter.js to enable multidimensional filtering on large datasets.
-Angular Framework: Leverage Angular's component-based architecture for scalable and maintainable code.
-Financial Data Visualization: Visualize financial data with various metrics and dimensions, providing insights into company performance, market trends, and sector distribution.

## Development Server
Run ng serve for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code Scaffolding
Run ng generate component component-name to generate a new component. You can also use ng generate directive|pipe|service|class|guard|interface|enum|module.

## Build
Run ng build to build the project. The build artifacts will be stored in the dist/ directory.

## Running Unit Tests
Run ng test to execute the unit tests via Karma.

## Running End-to-End Tests
Run ng e2e to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further Help
For more help on the Angular CLI, use ng help or visit the Angular CLI Overview and Command Reference page.
