// One small composer, shared by the map and standalone activities.
export function askQuestion(save){
 const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='question-dialog';
 dialog.innerHTML='<form><h2>留一个问题，下次接着想</h2><label for="question-text">现在有什么还想弄明白的？</label><textarea id="question-text" maxlength="1000" rows="4" required placeholder="用自己的话写就好。"></textarea><p class="question-error" role="alert"></p><div><button type="button" data-cancel>先不留</button><button type="submit" class="primary">留到下次</button></div></form>';
 document.body.append(dialog);const close=()=>{dialog.close();dialog.remove();previous?.focus();};dialog.querySelector('[data-cancel]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const text=dialog.querySelector('textarea').value;if(!text.trim())return;try{if(save(text)!==false)close();else dialog.querySelector('.question-error').textContent='还没保存成功，请保留这段文字。';}catch(error){dialog.querySelector('.question-error').textContent=error.message;}};
 dialog.showModal();dialog.querySelector('textarea').focus();
}
