// Side-effect imports to pick up dayjs plugin type augmentations.
// Required because composite project references don't carry module
// augmentations across project boundaries.
import "dayjs/plugin/utc";
import "dayjs/plugin/timezone";
import "dayjs/plugin/customParseFormat";
import "dayjs/plugin/isBetween";
import "dayjs/plugin/isSameOrBefore";
import "dayjs/plugin/isSameOrAfter";
import "dayjs/plugin/minMax";
