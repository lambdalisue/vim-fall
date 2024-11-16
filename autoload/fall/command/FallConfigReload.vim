function! fall#command#FallConfigReload#call() abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  call denops#notify('fall', 'config:reload', [])
endfunction
