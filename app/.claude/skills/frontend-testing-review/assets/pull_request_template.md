## អ្វីដែលបានផ្លាស់ប្តូរ / What changed
<!-- ពន្យល់ខ្លីៗ៖ ធ្វើអ្វី និងហេតុអ្វី / Briefly: what and why -->

Closes #

## របៀបសាកល្បង / How to test
1.
2.

## រូបថតអេក្រង់ / Screenshots
<!-- សម្រាប់ការផ្លាស់ប្តូរ UI / For UI changes -->
| | ខ្មែរ | English |
|---|---|---|
| Mobile 360px | | |
| Desktop | | |

## Checklist (អ្នកសរសេរកូដ / author)
- [ ] កូដដំណើរការតាមការរំពឹងទុក ទាំង happy path និង error / Works for happy path and errors
- [ ] មាន test សម្រាប់ logic ថ្មី ឬ bug fix / Tests added for new logic or bug fix
- [ ] `typecheck`, `lint`, `test` ឆ្លងកាត់ក្នុងម៉ាស៊ីនខ្ញុំ / Pass locally
- [ ] ស្ថានភាព loading, error, empty ត្រូវបានដោះស្រាយ / Loading, error, empty states handled
- [ ] អក្សរ UI ទាំងអស់នៅក្នុង `km` និង `en` / All UI strings in both `km` and `en`
- [ ] អក្សរខ្មែរមិនត្រូវកាត់ និងបត់បន្ទាត់ត្រឹមត្រូវ / Khmer not clipped, wraps correctly
- [ ] ដំណើរការលើ 360px គ្មានរំកិលចំហៀង / Works at 360px, no horizontal scroll
- [ ] ប្រើបានដោយ keyboard និងមាន label / Keyboard accessible, labelled
- [ ] គ្មាន secret, `console.log` ឬ code ដែលមិនប្រើ / No secrets, console.log or dead code
- [ ] គ្មាន dependency ធំថ្មីដោយមិនចាំបាច់ / No unnecessary heavy dependency

## កំណត់សម្គាល់សម្រាប់អ្នកពិនិត្យ / Notes for reviewers
<!-- ផ្នែកដែលគួរពិនិត្យឱ្យបានល្អិតល្អន់ / Areas needing careful review -->