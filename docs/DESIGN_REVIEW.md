# Interface and motion review

Applied the requested shadcn, Emil design engineering, and animate skills. The UI uses generated Radix-backed components with an original wine/paper visual system, Cormorant/Manrope typography, Gujarati font fallbacks, and original SVG illustrations.

| Before | After | Why |
| --- | --- | --- |
| Planning documents only | Responsive marketing, owner workspace, and guest invitation | A usable product connects discovery, creation, payment, and response management. |
| Generic component transitions | Explicit transform/opacity transitions; short button feedback | Motion responds to actions without moving readable form data. |
| Scene changes without spatial context | 280ms scene entrances with a consistent ease-out curve | Rare guest exploration benefits from a gentle transition. |
| Unconditional movement | Reduced-motion and keyboard input disable animation; hover effects gated by pointer capability | Interaction remains predictable for keyboard and motion-sensitive users. |
| Muted text just below required contrast on tinted paper | Darker semantic muted text | Browser axe checks caught the original contrast shortfall. |
| Rapid step clicks could overlap saves | Serialized navigation, disabled pending Continue | Prevent stale step transitions and preserve confirmed saves. |
| English owner labels only | Independent, persistent English/Gujarati workspace controls | The owner's UI language does not overwrite wedding content language. |

Dialogs, menus, selects, checkboxes, and radio groups use shadcn/Radix focus and keyboard behavior. Toasts use Sonner. No heavyweight motion library was needed. No photography or copyrighted wedding artwork was copied. Browser screenshots are in `docs/screenshots/`.

Physical-device touch/audio testing and a native Gujarati editorial review remain release gates. Automated accessibility checks cover the tested pages; they do not certify all combinations.
