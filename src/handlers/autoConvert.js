async function setAutoConvert(ctx) {
  const parts = ctx.message.text.split(' ').filter(Boolean);
  const user = ctx.state.user;

  if (parts[1] === 'clear' && parts[2]) {
    user.autoConvertRules.delete(parts[2].toLowerCase());
    await user.save();
    return ctx.reply(`Auto-convert rule for .${parts[2]} cleared.`);
  }

  const fromExt = parts[1]?.toLowerCase();
  const toExt = parts[2]?.toLowerCase();

  if (!fromExt || !toExt) {
    return ctx.reply(
      'Usage: /autoconvert <from_ext> <to_ext>\nExample: /autoconvert docx pdf\n\nTo clear a rule: /autoconvert clear docx'
    );
  }

  user.autoConvertRules.set(fromExt, toExt);
  await user.save();
  await ctx.reply(`✅ Done. From now on, any .${fromExt} file you send will auto-convert to .${toExt} — no buttons needed.`);
}

module.exports = setAutoConvert;
