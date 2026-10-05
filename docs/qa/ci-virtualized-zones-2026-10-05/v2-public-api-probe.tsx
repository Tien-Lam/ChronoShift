import { ComboBox } from "react-aria-components/ComboBox";
import type { AriaComboBoxOptions } from "react-aria/useComboBox";
import { Virtualizer, ListLayout } from "react-aria-components/Virtualizer";
const layout = new ListLayout();
const hookDelegate: Pick<AriaComboBoxOptions<unknown>, "layoutDelegate"> = { layoutDelegate: layout };
const viewport = <Virtualizer layout={layout} shouldObserveItemSize layoutOptions={{ estimatedRowSize: 62 }}><div /></Virtualizer>;
const comboBox = <ComboBox layoutDelegate={layout}><div /></ComboBox>;
void hookDelegate; void viewport; void comboBox;
