import JSBI from 'jsbi'
import { ChainId } from './chains'

/**
 * @deprecated use FACTORY_ADDRESS_MAP instead
 */
export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

export const FACTORY_ADDRESS_MAP: { [chainId: number]: string } = {
  [ChainId.MAINNET]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  [ChainId.GOERLI]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  [ChainId.SEPOLIA]: '0xB7f907f7A9eBC822a80BD25E224be42Ce0A698A0',
  [ChainId.OPTIMISM]: '0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf',
  [ChainId.ARBITRUM_ONE]: '0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9',
  [ChainId.AVALANCHE]: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C',
  [ChainId.BASE]: '0x8909dc15e40173ff4699343b6eb8132c65e18ec6',
  [ChainId.BNB]: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
  [ChainId.POLYGON]: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C',
  [ChainId.CELO]: '0x79a530c8e2fA8748B7B40dd3629C0520c2cCf03f',
  [ChainId.BLAST]: '0x5C346464d33F90bABaf70dB6388507CC889C1070',

  // bevmswap v1
  [ChainId.BEVM]: '0xAdEFa8CFD0655e319559c482c1443Cc6fa804C1F',
  [ChainId.BEVM_CANARY_TESTNET]: '0x1045D426488B359592864D3BDC3a64ebEBcDdf96',
  [ChainId.BITLAYER_TESTNET]: '0x57e0e352a82928a28ce453d9a9fa005a9922aa49'
}

/**
 * default from uniswap
 */
export const INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'

export const INIT_CODE_HASH_MAP: { [chainId: number]: string } = {
  // bevmswap v1
  [ChainId.BEVM]: '0xa1d96c4e569a8fba6c4ad8d633250547339e9fb98e185d256480ed16c528c9e2',
  [ChainId.BEVM_CANARY_TESTNET]: '0xa1d96c4e569a8fba6c4ad8d633250547339e9fb98e185d256480ed16c528c9e2',
  [ChainId.BITLAYER_TESTNET]: '0xa1d96c4e569a8fba6c4ad8d633250547339e9fb98e185d256480ed16c528c9e2'
}

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

/**
 * default from uniswap
 */
export const TRADE_FEE = JSBI.BigInt(9970) // 0.3%

export const TRADE_FEE_MAP: { [chainId: number]: JSBI } = {
  // bevmswap v1: 0.4%
  [ChainId.BEVM]: JSBI.BigInt(9960),
  [ChainId.BEVM_CANARY_TESTNET]: JSBI.BigInt(9960),
  [ChainId.BITLAYER_TESTNET]: JSBI.BigInt(9960)
}

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const FIVE = JSBI.BigInt(5)
export const _10000 = JSBI.BigInt(10000)
