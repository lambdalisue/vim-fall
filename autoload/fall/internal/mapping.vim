let s:saved_maps = []

function! fall#internal#mapping#store() abort
  if !empty(s:saved_maps)
    return
  endif
  let s:saved_maps = map(maplist(), { _, m -> m.mode == 'c' })
endfunction

function! fall#internal#mapping#restore() abort
  for l:m in s:saved_maps
    try
      call mapset(l:m)
    catch
    endtry
  endfor
endfunction
