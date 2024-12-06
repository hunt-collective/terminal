import { type Component, type JSX, type ParentProps } from 'solid-js'
import Line from '@components/line'
import Editor from '@components/editor'
import Caret from '@components/caret'

type CronProps = {} & JSX.HTMLAttributes<HTMLDivElement>
type SpanProps = ParentProps & JSX.HTMLAttributes<HTMLSpanElement>

const Code: Component<SpanProps> = ({ class: className, ...props }) => {
  return (
    <span
      class={`whitespace-pre bg-gray-6 py-0 px-3 w-full ${className}`}
      {...props}
    >
      <span class="leading-5">```{`\n`}</span>
      <span class="text-gray-300 leading-10">{props.children}</span>
      <span class="leading-5">{`\n`}```</span>
    </span>
  )
}

const Inline: Component<SpanProps> = ({ class: className, ...props }) => {
  return (
    <span class={`text-gray-300 bg-gray-6 -m-1 py-1 ${className}`} {...props}>
      `{props.children}`
    </span>
  )
}

const CronComponent: Component<CronProps> = () => {
  return (
    <Editor>
      <Line>
        <h1 class="text-white font-black"># Cron Quickstart</h1>
      </Line>
      <Line>
        <h2 class="font-semibold">
          ## Because SSH is too hard for twitch chat
        </h2>
      </Line>
      <Line />
      <Line>
        <p>
          Cron is a coffee subscription where each month you'll receive a
          special bag of coffee themed around the topics and memes that drive
          tech culture.
        </p>
      </Line>
      <Line />
      <Line>
        <p>
          In order to subscribe to Cron, you'll start by pasting the below
          command into your terminal:
        </p>
      </Line>
      <Line>
        <Code>ssh terminal.shop</Code>
      </Line>
      <Line />
      <Line>
        <p>You should see the Terminal Shop now.</p>
      </Line>
      <Line>
        <a href="/images/shop.png" target="_blank" class="whitespace-nowrap">
          ![Terminal Shop](/images/shop.png)
        </a>
      </Line>
      <Line />
      <Line>
        <p>
          Now navigate to <Inline>Cron</Inline> and hit <Inline>Enter</Inline>.
          This will take you to the checkout flow where you can provide your
          mailing address and payment info.
        </p>
      </Line>
      <Line />
      <Line>
        <p>
          Once you've finished this flow, you should see a confirmation page,
          and you're all set! You won't be billed until the next monthly box
          ships out (likely the start of the next month).
        </p>
      </Line>
      <Line />
      <Line>
        <p>
          You can also manage your subscription from inside the SSH store. Hit
          {` `}
          <Inline>a</Inline> to navigate to the account settings page after you
          SSH in, and then navigate to <Inline>Subscriptions</Inline>. From
          there you can cancel your subscription if you're just not feeling it
          anymore.
        </p>
      </Line>
      <Line />
      <Line>
        <div class="flex items-center gap-1.5">
          <h3 class="text-white whitespace-nowrap">Terminal Products, Inc.</h3>
          <Caret />
        </div>
      </Line>
    </Editor>
  )
}

export default CronComponent
