import { type Component, type JSX } from 'solid-js'
import Line from '@components/line'
import Editor from '@components/editor'
import Caret from '@components/caret'

type CronProps = {} & JSX.HTMLAttributes<HTMLDivElement>

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
        <p class="whitespace-pre bg-gray-900 py-0 px-4 w-full">
          ```{`\n`}
          <span class="text-white">ssh terminal.shop</span>
          {`\n`}```
        </p>
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
          Now navigate to `Cron` and hit `Enter`. This will take you to the
          checkout flow where you can provide your mailing address and payment
          info.
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
          `a` to navigate to the account settings page after you SSH in, and
          then navigate to `Subscriptions`. From there you can cancel your
          subscription if you're just not feeling it anymore.
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
