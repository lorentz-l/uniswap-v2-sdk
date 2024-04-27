import {
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
  Token,
  TradeType,
  validateAndParseAddress
} from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import { ONE } from './constants'
import { Pair, Trade } from './entities'

/**
 * Options for producing the arguments to send call to the router.
 */
export interface TradeOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  allowedSlippage: Percent
  /**
   * How long the swap is valid until it expires, in seconds.
   * This will be used to produce a `deadline` parameter which is computed from when the swap call parameters
   * are generated.
   */
  ttl: number
  /**
   * The account that should receive the output of the swap.
   */
  recipient: string

  /**
   * Whether any of the tokens in the path are fee on transfer tokens, which should be handled with special methods
   */
  feeOnTransfer?: boolean
}

export interface TradeOptionsDeadline extends Omit<TradeOptions, 'ttl'> {
  /**
   * When the transaction expires.
   * This is an atlernate to specifying the ttl, for when you do not want to use local time.
   */
  deadline: number
}

/**
 * The parameters to use in the call to the Uniswap V2 Router to execute a trade.
 */
export interface SwapParameters {
  /**
   * The method to call on the Uniswap V2 Router.
   */
  methodName: string
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: (string | string[])[]
  /**
   * The amount of wei to send in hex.
   */
  value: string
}

function toHex(currencyAmount: CurrencyAmount<Currency>) {
  return `0x${currencyAmount.quotient.toString(16)}`
}

const ZERO_HEX = '0x0'

export const quote = (amountA: Fraction, reserveA: Fraction, reserveB: Fraction): Fraction => {
  return amountA.multiply(reserveA).divide(reserveB)
}

/**
 * Represents the Uniswap V2 Router, and has static methods for helping execute trades.
 */
export abstract class Router {
  /**
   * Cannot be constructed.
   */
  private constructor() {}

  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(
    trade: Trade<Currency, Currency, TradeType>,
    options: TradeOptions | TradeOptionsDeadline
  ): SwapParameters {
    const etherIn = trade.inputAmount.currency.isNative
    const etherOut = trade.outputAmount.currency.isNative
    // the router does not support both ether in and out
    invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')
    invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

    const to: string = validateAndParseAddress(options.recipient)
    const amountIn: string = toHex(trade.maximumAmountIn(options.allowedSlippage))
    const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage))
    const path: string[] = trade.route.path.map((token: Token) => token.address)
    const deadline =
      'ttl' in options
        ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
        : `0x${options.deadline.toString(16)}`

    const useFeeOnTransfer = Boolean(options.feeOnTransfer)

    let methodName: string
    let args: (string | string[])[]
    let value: string
    switch (trade.tradeType) {
      case TradeType.EXACT_INPUT:
        if (etherIn) {
          methodName = useFeeOnTransfer ? 'swapExactETHForTokensSupportingFeeOnTransferTokens' : 'swapExactETHForTokens'
          // (uint amountOutMin, address[] calldata path, address to, uint deadline)
          args = [amountOut, path, to, deadline]
          value = amountIn
        } else if (etherOut) {
          methodName = useFeeOnTransfer ? 'swapExactTokensForETHSupportingFeeOnTransferTokens' : 'swapExactTokensForETH'
          // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
          args = [amountIn, amountOut, path, to, deadline]
          value = ZERO_HEX
        } else {
          methodName = useFeeOnTransfer
            ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens'
            : 'swapExactTokensForTokens'
          // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
          args = [amountIn, amountOut, path, to, deadline]
          value = ZERO_HEX
        }
        break
      case TradeType.EXACT_OUTPUT:
        invariant(!useFeeOnTransfer, 'EXACT_OUT_FOT')
        if (etherIn) {
          methodName = 'swapETHForExactTokens'
          // (uint amountOut, address[] calldata path, address to, uint deadline)
          args = [amountOut, path, to, deadline]
          value = amountIn
        } else if (etherOut) {
          methodName = 'swapTokensForExactETH'
          // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
          args = [amountOut, amountIn, path, to, deadline]
          value = ZERO_HEX
        } else {
          methodName = 'swapTokensForExactTokens'
          // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
          args = [amountOut, amountIn, path, to, deadline]
          value = ZERO_HEX
        }
        break
    }
    return {
      methodName,
      args,
      value
    }
  }

  public static addCallParameters(
    pair: Pair,
    amount0: CurrencyAmount<Currency>,
    amount1: CurrencyAmount<Currency>,
    options: TradeOptions | TradeOptionsDeadline
  ): SwapParameters {
    const ether0 = amount0.currency.isNative
    const ether1 = amount1.currency.isNative
    // the router does not support both ether in and out
    invariant(!(ether0 && ether1), 'ETHER_IN_OUT')
    invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

    // todo: invariant ETH and WETH

    const to: string = validateAndParseAddress(options.recipient)

    const slippageAdjusted = new Fraction(ONE).add(options.allowedSlippage).invert()
    let amountADesired = amount0.quotient.toString()
    let amountBDesired = amount1.quotient.toString()
    let amountAMin = slippageAdjusted
      .multiply(amountADesired)
      .add(1)
      .quotient.toString()
    let amountBMin = slippageAdjusted
      .multiply(amountBDesired)
      .add(1)
      .quotient.toString()

    console.log('amountADesired:', amountADesired)
    console.log('amountAMin    :', amountAMin)
    console.log('amountBDesired:', amountBDesired)
    console.log('amountBMin    :', amountBMin)

    if (!(pair.reserve0.equalTo(0) && pair.reserve1.equalTo(0))) {
      const amountBOptimal = quote(amount0, pair.reserve1, pair.reserve0).quotient.toString()
      console.log('amountBOptimal:', amountBOptimal)
      if (Number(amountBOptimal) <= Number(amountBDesired)) {
        console.log('amountBOptimal <= amountBDesired')
        if (Number(amountBOptimal) < Number(amountBMin)) {
          // or throw error
          console.log('amountBOptimal < amountBMin')
          amountBDesired = amountBOptimal
          amountBMin = slippageAdjusted
            .multiply(amountBDesired)
            .add(1)
            .quotient.toString()
        }
      } else {
        const amountAOptimal = quote(amount1, pair.reserve0, pair.reserve1).quotient.toString()
        console.log('amountAOptimal:', amountAOptimal)
        if (Number(amountAOptimal) <= Number(amountADesired)) {
          console.log('amountAOptimal <= amountADesired')
          if (Number(amountAOptimal) < Number(amountAMin)) {
            // or throw error
            console.log('amountAOptimal < amountAMin')
            amountADesired = amountAOptimal
            amountAMin = slippageAdjusted
              .multiply(amountADesired)
              .add(1)
              .quotient.toString()
          }
        } else {
          // todo: error?
        }
      }
    }

    const deadline =
      'ttl' in options
        ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
        : `0x${options.deadline.toString(16)}`

    let methodName: string
    let args: (string | string[])[]
    let value: string
    if (ether0) {
      methodName = 'addLiquidityETH'
      args = [pair.token1.address, amountBDesired, amountBMin, amountAMin, to, deadline]
      value = amountADesired
    } else if (ether1) {
      methodName = 'addLiquidityETH'
      args = [pair.token0.address, amountADesired, amountAMin, amountBMin, to, deadline]
      value = amountBDesired
    } else {
      methodName = 'addLiquidity'
      args = [
        pair.token0.address,
        pair.token1.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline
      ]
      value = ZERO_HEX
    }

    return {
      methodName,
      args,
      value
    }
  }

  public static removeCallParameters(
    pair: Pair,
    token0: Currency,
    token1: Currency,
    totalSupply: string,
    balance: string,
    decreasePercent: number,
    options: TradeOptions | TradeOptionsDeadline
  ): SwapParameters {
    const ether0 = token0.isNative
    const ether1 = token1.isNative
    // the router does not support both ether in and out
    invariant(!(ether0 && ether1), 'ETHER_IN_OUT')
    invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

    // todo: invariant ETH and WETH

    const to: string = validateAndParseAddress(options.recipient)

    const slippageAdjusted = new Fraction(ONE).add(options.allowedSlippage).invert()

    const liquidity = new Fraction(balance).multiply(decreasePercent).divide(100)
    const removePercent = liquidity.divide(totalSupply)
    const amountAMin = pair.reserve0
      .multiply(removePercent)
      .multiply(slippageAdjusted)
      .quotient.toString()
    const amountBMin = pair.reserve1
      .multiply(removePercent)
      .multiply(slippageAdjusted)
      .quotient.toString()

    const deadline =
      'ttl' in options
        ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
        : `0x${options.deadline.toString(16)}`

    let methodName: string
    let args: (string | string[])[]
    if (ether0) {
      methodName = 'removeLiquidityETH'
      args = [pair.token1.address, liquidity.quotient.toString(), amountBMin, amountAMin, to, deadline]
    } else if (ether1) {
      methodName = 'removeLiquidityETH'
      args = [pair.token0.address, liquidity.quotient.toString(), amountAMin, amountBMin, to, deadline]
    } else {
      methodName = 'removeLiquidity'
      args = [
        pair.token0.address,
        pair.token1.address,
        liquidity.quotient.toString(),
        amountAMin,
        amountBMin,
        to,
        deadline
      ]
    }

    return {
      methodName,
      args,
      value: ZERO_HEX
    }
  }
}
