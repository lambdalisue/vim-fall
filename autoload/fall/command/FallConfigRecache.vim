function! fall#command#FallConfigRecache#call() abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  call denops#notify('fall', 'config:recache', [])
endfunction
