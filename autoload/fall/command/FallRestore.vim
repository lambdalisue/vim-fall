function! fall#command#FallRestore#call()
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  let l:laststatus_saved = &laststatus
  try
    set laststatus=0
    call fall#internal#cursor#hide()
    call fall#internal#msgarea#hide()
    call fall#internal#mapping#store()
    call denops#request('fall', 'picker:restore', [])
  finally
    call fall#internal#mapping#restore()
    call fall#internal#msgarea#show()
    call fall#internal#cursor#show()
    " Close all popup windows in case of denops death
    silent! call fall#internal#popup#closeall()
    let &laststatus = l:laststatus_saved
  endtry
endfunction
