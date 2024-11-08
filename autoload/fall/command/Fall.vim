function! fall#command#Fall#call(args) abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  let l:laststatus_saved = &laststatus
  augroup fall_command_Fall
    autocmd!
    autocmd CmdlineEnter * call s:hide()
    autocmd CmdlineLeave * call s:show()
  augroup END
  try
    set laststatus=0
    call fall#internal#mapping#store()
    call denops#request('fall', 'picker:command', [a:args])
  finally
    augroup fall_command_Fall
      autocmd!
    augroup END
    call fall#internal#tolerant#call({ -> fall#internal#mapping#restore() })
    call fall#internal#tolerant#call({ -> fall#internal#popup#closeall() })
    let &laststatus = l:laststatus_saved
  endtry
endfunction

function! fall#command#Fall#complete(arglead, cmdline, cursorpos) abort
  if denops#plugin#wait('fall') isnot# 0
    return []
  endif
  return denops#request('fall', 'picker:command:complete', [a:arglead, a:cmdline, a:cursorpos])
endfunction

function! s:hide() abort
  call fall#internal#tolerant#call({ -> fall#internal#msgarea#hide() })
  call fall#internal#tolerant#call({ -> fall#internal#cursor#hide() })
endfunction

function! s:show() abort
  call fall#internal#tolerant#call({ -> fall#internal#msgarea#show() })
  call fall#internal#tolerant#call({ -> fall#internal#cursor#show() })
endfunction
