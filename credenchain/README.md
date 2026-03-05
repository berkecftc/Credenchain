# Credenchain

Credenchain is a decentralized application (dApp) built with Next.js that enables the creation, management, and verification of digital certificates on the Stellar/Soroban blockchain. By combining an intuitive web interface with smart contract technology, Credenchain ensures that certificates are immutable, verifiable, and securely stored both on-chain and in a PostgreSQL database.

**Live Site:** [https://credenchains.vercel.app](https://credenchains.vercel.app)


## Features
- **Blockchain Anchoring:** Issue digital certificates directly to the Stellar blockchain via Soroban smart contracts.
- **Wallet Integration:** Seamless connection with the Freighter wallet for signing transactions securely.
- **Database Storage:** Reliable metadata storage using PostgreSQL for rapid querying and indexing of certificate details.
- **Modern UI:** Built with Next.js 15, React 19, and Tailwind CSS.

## Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- Freighter Wallet browser extension installed

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd credenchain
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and configure it with your PostgreSQL and Stellar settings:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://user:password@localhost:5432/credenchain"

   # Stellar/Soroban Configuration
   NEXT_PUBLIC_CONTRACT_ID="your_smart_contract_id"
   NEXT_PUBLIC_STELLAR_NETWORK="TESTNET" # or PUBLIC
   ```

4. **Smart Contract (Optional for local development):**
   If you are working on the underlying smart contract, navigate to the `contracts/soroban_cert` directory. You will need Rust and the Stellar CLI to compile and deploy the contract.

## Usage

1. **Start the Development Server:**
   ```bash
   npm run dev
   ```

2. **Access the Application:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

3. **Issuing a Certificate:**
   - Open the web application and click the option to interact with the blockchain.
   - Connect your Freighter wallet when prompted.
   - Fill out the "Create Certificate" form with the required details (e.g., student name, course, completion date).
   - Submit the form and sign the transaction using the Freighter wallet extension.
   - Once the transaction is successfully mined, the certificate data is stored in the database and anchored on the Stellar blockchain.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

