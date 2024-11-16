function! fall#command#FallConfig#call() abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  call denops#notify('fall', 'config:edit', [])
endfunction
