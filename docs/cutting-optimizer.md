# Smart cutting optimizer

Standalone Home tool, hash route `#/cutting`. English UI. No Projects module was invented. Project name/customer are optional plan metadata. Existing receipt, register, Firestore, Firebase secrets, push and service-worker logic are unchanged.

## Engine and constraints

`cuttingOptimizer.js` is a pure local service. A bundled Web Worker keeps packing off the UI thread. A brief progress state is shown; browsers without Worker support use a local fallback. Six deterministic trials combine area/long-side/short-side part sorting with best-fit and largest-leftover placement scoring. Each trial expands quantities, prefers matching existing offcuts, checks already-opened pieces, then opens available stock only when needed. Final score prioritizes fitting parts, new sheets, total stock pieces, unused area and the largest reusable rectangle. This is a heuristic, not a proof of mathematical optimality. It supports at most 200 part instances and 200 stock instances; dimensions are in mm, at most 100000.

Every placement splits a free rectangle with two alternative guillotine orders. Each cut is a full straight cut across the section being processed. The engine retains cut region, local distance, absolute coordinates and order. Workshop Mode uses these actual records, not an invented sequence. It does not guarantee machine setup, clamping, support, handling or physical safety.

Kerf is removed at actual split boundaries, not added to every part. Exact edge fits need no cut. A leftover smaller than the full kerf is rejected, not falsely counted as another usable section. Trim removes the requested amount from all four edges, including blade loss. Nonzero trim must be at least kerf; its four real cut steps appear before part cuts. Distances in the sequence are from the current section edge; the kerf starts after the specified line.

Grain is Any, Horizontal, Vertical or Locked. Only Any parts with rotation explicitly allowed may rotate 90 degrees. Horizontal/Vertical is relative to the diagram axes and must match stock grain when stock direction is known. Locked parts retain their entered orientation. Any stock means unspecified grain, so the carpenter must check actual stock before cutting. Material (case-insensitive) and thickness must match. A mismatch, grain conflict, oversized part or exhausted stock produces a named unplaced entry; it is not silently dropped.

## Areas and offcuts

The scaled SVG uses real sheet dimensions and each placement's coordinates. Green is a part, pale is a free rectangle, grey is trim/blade loss. The numbered list carries full labels when rectangles are too small for readable text.

Used area is the sum of placed rectangles. Unused/waste area is total opened stock area minus part area and includes reusable leftovers. The UI separately reports reusable area and discard/blade/trim loss, so these categories are not confused. Reusable rectangles must have both sides at least 100 mm. This is a fixed practical cutoff in this version.

Saved offcuts are automatically included in the next optimization, subject to material, thickness, grain and available quantity. Adding one manually to the form does not duplicate it. "Save to stock" asks the user to confirm the piece was cut and measured. Repeating that save for the same plan/offcut is idempotent. Optimizing/saving a plan does not consume or reserve physical inventory. After cutting, "Mark used offcuts consumed" explicitly removes used saved offcuts. New sheet quantities are plan inputs, not an inventory system.

## Local data and printing

`cuttingStorage.js` stores the draft, up to 30 plans and offcuts at `sab-tools-cutting-v1` on this browser. Saved plans carry metadata, input, grain/rotation rules, kerf, results, offcuts and timestamp. Loading recalculates and validates input. Storage failures are reported; unreadable data is not overwritten. Clearing site data deletes local plans. No account/cloud backup is implied.

Print Plan / PDF uses the existing browser print mechanism, no new PDF library. Print CSS includes project/customer, cut list, stock/material/thickness, diagram, summary, cut sequence, kerf, waste and offcuts, and removes editor/actions. Native "Save as PDF" is the export route.

## Verification

`npm test`: 129 tests, including 19 optimizer/storage tests: no-overlap/bounds, blade loss/area conservation, example dimensions, multiple stock, quantity, zero/3mm kerf, exact fit/sub-kerf rejection, directional/locked grain, rotation, trim, mismatch/oversize, determinism, offcut preference/reuse, invalid input, storage failure/save/load, practical guillotine replay and 100-part performance.

Both root and GitHub Pages builds pass. Chrome browser verification at 390px/320px creates the user's example, checks all eight parts placed, saves the plan/offcut, advances Workshop steps, generates print PDFs, reloads offline, opens saved plan and optimizes again offline using saved offcuts. No page errors or page overflow. Existing legacy/offline/update/recovery suite also passes unchanged.

Typical 100-part packing measured about 78 ms in the local engine check. The example placed 8 parts on one 2440 × 1220 sheet with 3mm kerf: used area 2.09m² (70.2%), unused 0.8868m² (29.8%), 3 reusable rectangles and 12 cuts. The example allows shelf/door rotation, but locks the sides vertically. Grain-sensitive doors should be entered with their required direction.

Known limits: rectangular parts only, all mm, heuristic not guaranteed minimum, fixed offcut cutoff, no machine-specific saw handling or proof of physical safety, no automatic inventory consumption/cloud sync, local-only data can be lost if site storage is cleared. No deployment is included in this change.
