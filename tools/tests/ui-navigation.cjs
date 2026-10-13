// Follow the public menu instead of clicking controls that are no longer permanent.
async function menu(p){if(await p.locator('#menuDialog').isVisible())return;for(const id of ['closeStaff','closeProducts','closeSettings','closeReport','closeInterior'])if(await p.locator('#'+id).isVisible())await p.locator('#'+id).click();if(!await p.locator('#openMenu').isVisible()&&await p.locator('#cancel').isVisible())await p.locator('#cancel').click();await p.locator('#openMenu').click()}
async function click(p,selector){if(selector==='#cancel'&&!await p.locator(selector).isVisible())return;if(selector.startsWith('[data-type=')&&!await p.locator(selector).isVisible()){await menu(p);await p.locator('#build').click()}
if(!await p.locator(selector).isVisible()){await menu(p);if(['#reset','#plus','#minus'].includes(selector))await p.locator('#settings').click();else if(['#make','#restock'].includes(selector))await p.locator('#products').click()}
await p.locator(selector).click();if(['#make','#restock'].includes(selector)&&await p.locator('#productDialog').isVisible())await p.locator('#closeProducts').click()}
module.exports={menu,click};
