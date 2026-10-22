import type { ContentItemDef, ContentItems } from '../types'

// Wording of the redesigned comments block (src/components/comments). Defaults are Kinyarwanda like the rest of the
// comments copy; a super admin can reword any of them in the dashboard. The older comment items live in ./article.ts.

const GROUP = "Comments"

function text(label: string, def: string, where: string, maxLength: number): ContentItemDef {
  return { group: GROUP, label, kind: "text", default: def, where, maxLength }
}

function textarea(label: string, def: string, where: string, maxLength: number): ContentItemDef {
  return { group: GROUP, label, kind: "textarea", default: def, where, maxLength }
}

function template(label: string, def: string, where: string, maxLength: number, placeholders: readonly string[]): ContentItemDef {
  return { group: GROUP, label, kind: "template", default: def, where, maxLength, placeholders }
}

export const COMMENTS = {
  "article.comments.heading": text("Comments heading", "Ibitekerezo", "Heading above the comments block (the number of comments is shown next to it).", 40),
  "article.comments.emptyHint": text("Text under \"no comments yet\"", "Ba uwa mbere utanga igitekerezo kuri iyi nkuru.", "Shown under the \"no comments\" message when an article has none.", 120),
  "article.comments.retry": text("\"Try again\" button (comments failed to load)", "Ongera ugerageze", "Button under the message shown when comments cannot be loaded.", 40),
  "article.comments.sortGroup": text("Sort control description (screen readers)", "Gutondeka ibitekerezo", "Read aloud by screen readers for the Popular / Newest switch.", 60),
  "article.comments.sortTop": text("\"Popular\" sort button", "Bikunzwe", "Sort button that shows the most liked comments first.", 30),
  "article.comments.sortNewest": text("\"Newest\" sort button", "Bishya", "Sort button that shows the newest comments first.", 30),
  "article.comments.settingsOpen": text("Settings button description (screen readers)", "Igenamiterere n'amategeko y'ibitekerezo", "Read aloud by screen readers for the gear button next to the sort buttons.", 80),
  "article.comments.promptText": text("Text in the \"write a comment\" bar", "Tanga igitekerezo cyawe…", "The bar readers click to open the comment form.", 60),
  "article.comments.formLabel": text("Comment box label", "Igitekerezo cyawe", "Label above the main comment box.", 50),
  "article.comments.replyLabel": template("Reply box label", "Subiza {name}", "Label above the reply box. {name} is replaced by the person being replied to.", 60, ["name"]),
  "article.comments.emailHint": text("Note under the email box", "Imeri yawe ntigaragara ku rubuga. Ikoreshwa mu kugenzura gusa.", "Reassurance shown under the email box.", 140),
  "article.comments.guidelines": text("\"Guidelines\" button", "Amategeko", "Button in the comment form that opens the comment rules.", 40),
  "article.comments.cancel": text("\"Cancel\" button", "Reka", "Button that closes the comment or reply form.", 30),
  "article.comments.errEmptyComment": text("Warning: comment is empty", "Andika igitekerezo mbere yo kucyohereza.", "Shown if a reader sends the comment form with no text.", 120),
  "article.comments.errEmptyReply": text("Warning: reply is empty", "Andika igisubizo mbere yo kucyohereza.", "Shown if a reader sends the reply form with no text.", 120),
  "article.comments.errIdentity": text("Warning: name or email missing", "Andika amazina yawe n'imeri yemewe.", "Shown if the name is empty or the email is not valid.", 120),
  "article.comments.pending": text("\"Waiting for review\" tag", "Gitegereje kugenzurwa", "Small tag on a comment the reader just sent, until the team has approved it.", 40),
  "article.comments.you": text("\"You\" tag", "WOWE", "Small tag next to a comment the reader just sent.", 20),
  "article.comments.like": template("Like button description (screen readers)", "Kunda igitekerezo, bamaze gukunda {count}", "Read aloud for the like button. {count} is the number of likes.", 80, ["count"]),
  "article.comments.unlike": template("Unlike button description (screen readers)", "Reka gukunda igitekerezo, bamaze gukunda {count}", "Read aloud for the like button after it was pressed. {count} is the number of likes.", 80, ["count"]),
  "article.comments.report": text("\"Report\" button", "Kanda hano niba igitekerezo kibangamye", "Button under a comment for reporting it to the team.", 60),
  "article.comments.reportAria": text("Report button description (screen readers)", "Tanga raporo kuri iki gitekerezo", "Read aloud for the report button.", 80),
  "article.comments.reported": text("\"Reported\" button text", "Raporo yoherejwe", "Replaces the report button after a reader reported a comment.", 30),
  "article.comments.reportDone": text("Message after reporting", "Raporo yawe yoherejwe. Murakoze.", "Confirmation shown after a reader reports a comment.", 120),
  "article.comments.reportError": text("Message when reporting fails", "Ntitwabashije kohereza raporo. Ongera ugerageze.", "Shown if a report could not be sent.", 120),
  "article.comments.likeError": text("Message when a like fails", "Ntitwabashije kubika ibyo wakunze. Ongera ugerageze.", "Shown if a like could not be saved.", 120),
  "article.comments.showReplies": template("\"Show replies\" button", "Erekana ibisubizo ({count})", "Opens the replies under a comment. {count} is the number of replies.", 60, ["count"]),
  "article.comments.hideReplies": text("\"Hide replies\" button", "Hisha ibisubizo", "Closes the replies under a comment.", 40),
  "article.comments.loadMore": text("\"Show more comments\" button", "Erekana ibindi bitekerezo", "Button at the bottom of a long comment list.", 50),
  "article.comments.justNow": text("\"Just now\"", "Ubu nyine", "Time label for a comment sent less than a minute ago.", 30),
  "article.comments.minutesAgo": template("\"Minutes ago\"", "Hashize iminota {count}", "Time label for a comment sent minutes ago. {count} is the number of minutes.", 50, ["count"]),
  "article.comments.hoursAgo": template("\"Hours ago\"", "Hashize amasaha {count}", "Time label for a comment sent hours ago. {count} is the number of hours.", 50, ["count"]),
  "article.comments.yesterday": text("\"Yesterday\"", "Ejo hashize", "Time label for a comment sent yesterday.", 30),
  "article.comments.settingsTitle": text("Settings box title", "Igenamiterere ry'ibitekerezo", "Title of the box opened by the gear button.", 50),
  "article.comments.tabSettings": text("Settings tab name", "Ibyanjye", "First tab of the gear box.", 30),
  "article.comments.tabRules": text("Rules tab name", "Amategeko", "Second tab of the gear box.", 30),
  "article.comments.rememberLabel": text("\"Remember me\" switch", "Unyibuke", "Switch that keeps the reader's name and email on their device.", 40),
  "article.comments.rememberHint": text("\"Remember me\" explanation", "Bika amazina na email kuri iki gikoresho. Amazina na email bibikwa kuri iki gikoresho cyawe gusa kugira ngo utongera kuyandika", "Small text under the \"Remember me\" switch.", 160),
  "article.comments.settingsNote": textarea("Note under the settings", "", "Small note at the bottom of the settings tab.", 200),
  "article.comments.rulesLink": text("\"Read all the rules\" link", "Soma amategeko yose y'ibitekerezo", "Link under the short rules to the full comment guidelines page.", 60),
  "article.comments.rule1.title": text("Comment rule 1: title", "Subiza neza.", "Bold first words of one of the five short rules in the gear box.", 50),
  "article.comments.rule1.body": text("Comment rule 1: text", "Nta kutukana, urwango cyangwa gutera abandi.", "Rest of the sentence of one of the five short rules in the gear box.", 140),
  "article.comments.rule2.title": text("Comment rule 2: title", "Guma ku nkuru.", "Bold first words of one of the five short rules in the gear box.", 50),
  "article.comments.rule2.body": text("Comment rule 2: text", "Vuga ku nkuru, ntuvuge ku bandi basomyi.", "Rest of the sentence of one of the five short rules in the gear box.", 140),
  "article.comments.rule3.title": text("Comment rule 3: title", "Nta butumwa bwamamaza.", "Bold first words of one of the five short rules in the gear box.", 50),
  "article.comments.rule3.body": text("Comment rule 3: text", "Nta matangazo cyangwa imirongo itajyanye n'inkuru.", "Rest of the sentence of one of the five short rules in the gear box.", 140),
  "article.comments.rule4.title": text("Comment rule 4: title", "Rinda ubuzima bwite.", "Bold first words of one of the five short rules in the gear box.", 50),
  "article.comments.rule4.body": text("Comment rule 4: text", "Ntugashyire hanze nimero za telefoni, aderesi cyangwa amakuru bwite y'undi muntu.", "Rest of the sentence of one of the five short rules in the gear box.", 140),
  "article.comments.rule5.title": text("Comment rule 5: title", "Ibitekerezo biragenzurwa.", "Bold first words of one of the five short rules in the gear box.", 50),
} as const satisfies ContentItems
