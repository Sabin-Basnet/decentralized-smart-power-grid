FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Compile contracts
RUN npx hardhat compile

# Expose Hardhat network port
EXPOSE 8545

# Run Hardhat node
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
