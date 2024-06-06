function! fall#command#Fall#call(args) abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  try
    call fall#internal#cursor#hide()
    call fall#internal#msgarea#hide()
    call denops#request('fall', 'picker:start', [a:args])
  finally
    silent! call fall#internal#msgarea#show()
    silent! call fall#internal#cursor#show()
  endtry
endfunction

function! fall#command#Fall#complete(arglead, cmdline, cursorpos) abort
  return denops#request('fall', 'extension:complete', [a:arglead, a:cmdline, a:cursorpos])
endfunction
