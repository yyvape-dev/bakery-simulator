// Follow the public menus, sample book and explicit renovation confirmation.
async function finishRenovation(p){
 if(await p.locator('#renovationActions').isVisible()){
  if(!await p.locator('#renovationReview').isVisible())await p.locator('#cancel').click();
  if(await p.locator('#commitRenovation').isEnabled())await p.locator('#commitRenovation').click();
  else await p.locator('#discardRenovation').click();
 }
}
async function menu(p){if(await p.locator('#menuDialog').isVisible())return;
 if(await p.locator('#materialBook').isVisible())await p.locator('#closeMaterialBook').click();
 for(const id of ['closeStaff','closeProducts','closeSettings','closeReport'])if(await p.locator('#'+id).isVisible())await p.locator('#'+id).click();
 await finishRenovation(p);
 if(!await p.locator('#openMenu').isVisible()&&await p.locator('#cancel').isVisible())await p.locator('#cancel').click();
 await p.locator('#openMenu').click();
}
async function click(p,selector){
 if(selector==='#closeInterior')selector='#cancel';
 if(selector==='#cancel'&&await p.locator('#renovationActions').isVisible())return finishRenovation(p);
 if(selector==='#interior'){await menu(p);await p.locator('#build').click();await p.locator('[data-category=floor]').click();return}
 if(selector.startsWith('[data-category=')&&!await p.locator(selector).isVisible()){await menu(p);await p.locator('#build').click()}
 if(['#expandWidth','#expandHeight'].includes(selector)){
  if(!await p.locator('[data-category=expansion]').isVisible()){await menu(p);await p.locator('#build').click()}
  await p.locator('[data-category=expansion]').click();await p.locator(selector).click();await p.locator('#applyExpansion').click();await finishRenovation(p);return;
 }
 if(selector==='#cancel'&&!await p.locator(selector).isVisible())return;
 if(selector.startsWith('[data-type=')){
  if(!await p.locator('[data-category=furniture]').isVisible()){await menu(p);await p.locator('#build').click()}
  await p.locator('[data-category=furniture]').click();await p.locator('#chooseMaterial').click();await p.locator(selector).click();return;
 }
 if(!await p.locator(selector).isVisible()){await menu(p);if(['#reset','#plus','#minus'].includes(selector))await p.locator('#settings').click();else if(['#make','#restock'].includes(selector))await p.locator('#products').click()}
 await p.locator(selector).click();if(['#make','#restock'].includes(selector)&&await p.locator('#productDialog').isVisible())await p.locator('#closeProducts').click();
}
module.exports={menu,click,finishRenovation};
