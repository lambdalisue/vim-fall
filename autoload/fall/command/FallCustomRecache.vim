function! fall#command#FallCustomRecache#call() abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  call denops#notify('fall', 'custom:recache', [#{ verbose: v:true }])
endfunction
