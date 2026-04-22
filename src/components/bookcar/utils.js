export const buildInitialPlan = (carType, carCount, pickUp, dropOff) => [
  {
    carType,
    carCount: String(carCount),
    pickUp,
    dropOff,
  },
];

export const getReadableErrorMessage = (error) => {
  const rawMessage =
    error?.reason ||
    error?.data?.message ||
    error?.error?.message ||
    error?.message ||
    "Payment failed";

  return rawMessage
    .replace(/^execution reverted:\s*/i, "")
    .replace(/^Error:\s*/i, "");
};

export const buildSuggestedSplitPlan = (
  selectedType,
  totalCount,
  selectedPick,
  selectedDrop,
  availabilityMap,
  carTypes
) => {
  const remainingPlan = [];
  let remaining = totalCount;

  const selectedAvailable = availabilityMap[selectedType] || 0;
  if (selectedAvailable > 0) {
    const take = Math.min(selectedAvailable, remaining);
    remainingPlan.push({
      carType: selectedType,
      carCount: String(take),
      pickUp: selectedPick,
      dropOff: selectedDrop,
    });
    remaining -= take;
  }

  const fallbackTypes = carTypes
    .filter((type) => type !== selectedType)
    .map((type) => ({ type, available: availabilityMap[type] || 0 }))
    .filter((item) => item.available > 0)
    .sort((a, b) => b.available - a.available);

  for (const item of fallbackTypes) {
    if (remaining <= 0) break;
    const take = Math.min(item.available, remaining);
    remainingPlan.push({
      carType: item.type,
      carCount: String(take),
      pickUp: selectedPick,
      dropOff: selectedDrop,
    });
    remaining -= take;
  }

  return { plan: remainingPlan, remaining };
};
