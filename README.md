# Oldphonedeals

OldPhoneDeals is a second-hand phone trading platform designed to connect buyers and sellers in a safe, transparent, and user-friendly environment. Our goal is to promote the reuse of electronic devices by making it easier to sell and purchase pre-owned smartphones with confidence.

## Built With

* [MongoDB](https://www.mongodb.com/) – NoSQL database used to store user data, listings, reviews, and transactions  
- [Express](https://expressjs.com/) – Backend web framework for handling APIs and server logic  
- [Vue 3](https://vuejs.org/) – Frontend framework for building a responsive, reactive user interface  
- [Node.js](https://nodejs.org/) – JavaScript runtime environment powering the backend application

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

```
Node.js >= 18   (22.11  Recommended)
```

### Data import

After starting the backend for the first time, enter the corresponding database and import the data into phonelisting and userlist. You need to modify the image url of phonelisting to **"/images/PhoneImages/(image file)"**

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Project Setup

### 1. Install Dependencies

Install frontend dependencies (in the project root):

```sh
npm install
```
Then install backend dependencies (in the server directory):

```sh
cd server
npm install
```

### 2. Compile and Hot-Reload for Development
Start the backend server: <br>
Modify the database name in server/models/db.js to connect to the database and then
```sh
cd server
node server.js
```
Then, in a separate terminal window, start the frontend dev server:
```sh
npm run dev
```
- Frontend available at port 5173

- Backend API runs at port 3000

### Compile and Minify for Production

To compile and minify the frontend for production:

```sh
npm run build
```
