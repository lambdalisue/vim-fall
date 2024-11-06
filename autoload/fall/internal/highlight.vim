function! fall#internal#highlight#fast(filetype)
  let l:eventignore_saved = &eventignore
  try
    set eventignore+=FileType
    call fall#internal#highlight#real(a:filetype)
  finally
    let &eventignore = l:eventignore_saved
  endtry
  silent! execute printf('runtime syntax/%s.vim', fnameescape(&filetype))
endfunction

function! fall#internal#highlight#real(filetype)
  if empty(a:filetype)
    silent! unlet! b:ftdetect
    silent! filetype detect
  else
    let &filetype = a:filetype
  endif
endfunction
