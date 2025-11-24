# Talklet Review

A privacy-preserving academic session review system built with FHEVM (Fully Homomorphic Encryption Virtual Machine) by Zama. This project enables encrypted ratings and homomorphic aggregation of feedback for academic sessions while maintaining complete privacy.

## Overview

Talklet Review is a decentralized application (dApp) that allows:
- **Organizers** to create academic sessions and manage reviews
- **Attendees** to submit encrypted ratings (clarity, innovation, inspiration)
- **Privacy-preserving aggregation** of scores using homomorphic encryption
- **Decrypted results** available only to authorized organizers

All ratings are encrypted on-chain using FHEVM, ensuring that individual reviews remain private until aggregation and decryption.

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/             # Solidity contracts
│   │   ├── TalkletReview.sol # Main review contract
│   │   └── FHECounter.sol    # Example FHEVM contract
│   ├── deploy/               # Deployment scripts
│   ├── test/                 # Contract tests
│   └── tasks/                # Hardhat tasks
│
└── talklet-review-frontend/  # Next.js frontend application
    ├── app/                  # Next.js app router pages
    ├── components/           # React components
    ├── fhevm/                # FHEVM integration layer
    ├── hooks/                # React hooks
    └── scripts/              # Build and utility scripts
```

## Features

### Smart Contract Features
- **Encrypted Ratings**: All scores stored as encrypted `euint16` values
- **Homomorphic Aggregation**: Add encrypted scores without decryption
- **Access Control**: Organizer-based authorization for attendees
- **Privacy-Preserving**: Individual reviews remain encrypted until organizer decryption
- **Session Management**: Create, activate, and manage academic sessions

### Frontend Features
- **Wallet Integration**: MetaMask and EIP-6963 wallet support
- **Dual Mode Operation**: 
  - Mock mode for local development (`dev:mock`)
  - Real Relayer mode for production (`dev`)
- **Static Export**: Fully static Next.js export for deployment
- **Responsive UI**: Modern, accessible design with dark mode support
- **Session Management**: Create sessions, submit reviews, view rankings

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask** or compatible Web3 wallet
- **Hardhat** (for local development)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mewiskl/zama_Talklet_Review.git
cd zama_Talklet_Review
```

### 2. Install Contract Dependencies

```bash
cd fhevm-hardhat-template
npm install
```

### 3. Set Up Environment Variables

```bash
# Set your mnemonic phrase
npx hardhat vars set MNEMONIC

# Set Infura API key for network access
npx hardhat vars set INFURA_API_KEY

# Optional: Set Etherscan API key for contract verification
npx hardhat vars set ETHERSCAN_API_KEY
```

### 4. Install Frontend Dependencies

```bash
cd ../talklet-review-frontend
npm install
```

## Development

### Smart Contracts

#### Compile Contracts

```bash
cd fhevm-hardhat-template
npm run compile
```

#### Run Tests

```bash
# Local tests
npm run test

# Sepolia testnet tests
npm run test:sepolia
```

#### Deploy Contracts

```bash
# Deploy to local network
npx hardhat node
npx hardhat deploy --network localhost

# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia
```

#### Available Hardhat Tasks

```bash
# List all tasks
npx hardhat

# TalkletReview specific tasks
npx hardhat talklet-review:create-session --network localhost
npx hardhat talklet-review:get-session --session-id 0 --network localhost
```

### Frontend

#### Development Modes

**Mock Mode** (for local Hardhat node):
```bash
cd talklet-review-frontend
npm run dev:mock
```

This mode:
- Checks if local Hardhat node is running
- Generates ABI and address mappings
- Uses `@fhevm/mock-utils` for local development

**Production Mode** (with real Relayer):
```bash
cd talklet-review-frontend
npm run dev
```

This mode:
- Generates ABI and address mappings
- Uses `@zama-fhe/relayer-sdk` for production networks

#### Build for Production

```bash
# Check static export compliance
npm run check:static

# Build static export
npm run build
```

The build output will be in the `out/` directory, ready for static hosting.

## Usage

### Creating a Session

1. Connect your wallet
2. Navigate to "Organizer" page
3. Fill in session details (title, speaker address)
4. Click "Create Session"
5. Authorize attendees by adding their addresses

### Submitting a Review

1. Navigate to "Sessions" page
2. Select a session
3. Connect your wallet (must be authorized)
4. Submit encrypted ratings for:
   - Clarity (1-10)
   - Innovation (1-10)
   - Inspiration (1-10)
5. Add tags and Q&A duration if applicable

### Viewing Results

- **Organizers** can decrypt and view aggregated scores
- **Public rankings** show decrypted average scores
- **My Reviews** page shows your submitted reviews

## Architecture

### Smart Contract Architecture

The `TalkletReview` contract uses:
- **FHEVM Types**: `euint16` for encrypted integers
- **Homomorphic Operations**: `FHE.add()` for encrypted aggregation
- **External Encryption**: `FHE.fromExternal()` for client-side encryption
- **Access Control**: Mapping-based authorization system

### Frontend Architecture

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with design tokens
- **State Management**: React hooks and context
- **Wallet Integration**: Ethers.js v6 with EIP-6963 support
- **FHEVM Integration**: 
  - Relayer SDK for production
  - Mock utils for local development

## Network Configuration

### Supported Networks

- **Localhost** (Hardhat): Chain ID 31337
- **Sepolia Testnet**: Chain ID 11155111

### Adding New Networks

Edit `talklet-review-frontend/fhevm/internal/constants.ts` to add network configurations.

## Security Considerations

- All ratings are encrypted on-chain using FHEVM
- Only authorized attendees can submit reviews
- Only organizers can decrypt aggregated scores
- Private keys never leave the user's wallet
- Decryption signatures are stored locally

## Contributing

This project follows a feature branch workflow:

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

See `fhevm-hardhat-template/LICENSE` for license information.

## Resources

- [FHEVM Documentation](https://docs.zama.ai/protocol)
- [Zama FHEVM](https://github.com/zama-ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues and questions:
- Check the [FHEVM Hardhat Template README](./fhevm-hardhat-template/README.md)
- Review contract tests in `fhevm-hardhat-template/test/`
- Check frontend examples in `talklet-review-frontend/app/`

## Acknowledgments

Built with [FHEVM](https://github.com/zama-ai/fhevm) by [Zama](https://www.zama.ai/).

