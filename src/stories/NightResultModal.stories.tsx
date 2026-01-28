import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { NightResultModal } from "../components/common/NightResultModal";

const meta = {
  title: "Modals/NightResultModal",
  component: NightResultModal,
  parameters: { layout: "fullscreen" },
  args: {
    onConfirm: fn(),
  },
} satisfies Meta<typeof NightResultModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SeerLookPlayer: Story = {
  args: {
    title: "花子の役職",
    targets: [{ name: "花子", role: "WEREWOLF" }],
  },
};

export const SeerLookCenter: Story = {
  args: {
    title: "墓地のカード",
    targets: [
      { name: "中央カード1", role: "SEER" },
      { name: "中央カード2", role: "VILLAGER" },
    ],
  },
};

export const RobberSwap: Story = {
  args: {
    title: "花子から占い師を奪った",
    targets: [{ name: "花子", role: "SEER" }],
  },
};
